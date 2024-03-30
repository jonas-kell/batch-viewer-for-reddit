import { decryptText, encryptText, getRandomIvString } from "./encrypt";
import { Post, MemorySession, StoredSession, FileMeta, FileMetaEntry } from "./interfaces";
import useKeysStore from "./../stores/keys";
import { readInZipFile } from "./zipFilesManagement";
import { decryptPostObject, encryptPostObject } from "./postEncryptionManagement";
import toastr from "toastr";

async function getSessionDirectoryHandle() {
    const originPrivateFileSystem = await navigator.storage.getDirectory();
    const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle("session-storage", { create: true });

    return sessionDirHandle;
}

async function getSessionPostsDirectoryHandle(sessionNameOrFileName: string) {
    if (sessionNameOrFileName != "") {
        const originPrivateFileSystem = await navigator.storage.getDirectory();
        const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle(getSessionFileNameStem(sessionNameOrFileName), {
            create: true,
        });

        return sessionDirHandle;
    }
    return null;
}

export async function parseSessionsMetaFromFilesystem(scope: string) {
    const sessionDirHandle = await getSessionDirectoryHandle();

    let res = {} as { [key: string]: MemorySession };

    // rebuild sessions array
    for await (const entry of (sessionDirHandle as any).values()) {
        // any to silence error, but values() exists on FileSystemDirectoryHandle.... https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/values

        // TODO use different regex?
        if (entry.kind == "file" && entry.name.match(/Session_\d*(_encrypted)?.json/g)) {
            const file: File = await entry.getFile();

            // parse info
            let parsedSession: StoredSession = JSON.parse(await file.text());
            const is_encrypted = parsedSession.encrypted;
            const session_iv_string = parsedSession.iv_string;
            let throws_error = false;
            try {
                await decryptText(parsedSession.encryption_test, session_iv_string, scope);
            } catch (error) {
                throws_error = true;
            }
            const can_be_decrypted = !is_encrypted || (is_encrypted && useKeysStore().encryptionOn(scope) && !throws_error);

            // decrypt posts
            let posts = {} as { [key: string]: Post };
            if (useKeysStore().encryptionOn(scope) && can_be_decrypted && is_encrypted) {
                // need to decrypt
                for (const post_id_enc in parsedSession.posts) {
                    const post_id = await decryptText(post_id_enc, session_iv_string, scope);
                    // in case of encryption
                    const post_object = JSON.parse(
                        await decryptText(parsedSession.posts[post_id_enc] as string, session_iv_string, scope)
                    );
                    posts[post_id] = await decryptPostObject(post_object, scope);
                }
            } else {
                // just do a copy
                posts = JSON.parse(JSON.stringify(parsedSession.posts));
            }

            // add results to return array
            res[parsedSession.name] = {
                name: parsedSession.name,
                is_encrypted: is_encrypted,
                iv_string: session_iv_string,
                can_be_decrypted: can_be_decrypted,
                posts: posts,
                file_meta: JSON.parse(JSON.stringify(parsedSession.file_meta)),
                session: parsedSession,
            };
        }
    }

    return res;
}

function getSessionMetaFilename(sessionNameOrFileName: string): string {
    return getSessionFileNameStem(sessionNameOrFileName) + ".json";
}

function getSessionFileNameStem(sessionNameOrFileName: string): string {
    return sessionNameOrFileName.split(".")[0];
}

export async function createSession(sessionNameOrFileName: string, scope: string) {
    const filename = getSessionMetaFilename(sessionNameOrFileName);
    const sessionDirHandle = await getSessionDirectoryHandle();
    const sessionFileHandle = await sessionDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await sessionFileHandle.createWritable();
    const iv_string = getRandomIvString();

    const newSession: StoredSession = {
        name: filename,
        encrypted: useKeysStore().encryptionOn(scope),
        encryption_test: await encryptText(String(Math.random()), iv_string, scope),
        iv_string: iv_string,
        posts: {},
        file_meta: {},
    };

    await writable.write(JSON.stringify(newSession));
    await writable.close();
}

export async function deleteSession(sessionNameOrFileName: string) {
    const sessionDirHandle = await getSessionDirectoryHandle();
    await sessionDirHandle.removeEntry(getSessionMetaFilename(sessionNameOrFileName));

    const dataDirHandle = await getSessionPostsDirectoryHandle(sessionNameOrFileName); // !! deletion doesn't care about scope
    if (dataDirHandle) {
        await (await navigator.storage.getDirectory()).removeEntry(dataDirHandle.name, { recursive: true }); // TODO if data dir is shared, this could cause problems. Keep in mind
    }
}

export async function includePostsFileInSessionAndUploadToOPFS(file: File, session: MemorySession, scope: string) {
    const filename = file.name;
    const dataDirHandle = await getSessionPostsDirectoryHandle(session.name);

    if (!dataDirHandle) {
        toastr.error("OPFS error");
        return;
    }

    // check if can be processed
    let filenames = getSessionDataFilesNames(session);
    if (filenames.includes(filename)) {
        toastr.warning("Already included file: " + filename);
        return;
    }
    const file_encrypted = filename.includes("_encrypted");
    const encryption_enabled = useKeysStore().encryptionOn(scope);
    if (encryption_enabled != file_encrypted) {
        toastr.error("Encryption mismatch for file: " + filename);
        return;
    }

    // process meta
    let filePostMetaInfo = null;
    try {
        filePostMetaInfo = await readInZipFile(file, scope);
    } catch (error) {
        toastr.error("Decryption Key mismatch for file: " + filename);
        return;
    }

    // TODO only include these if not already included?

    // append posts
    for (let post of filePostMetaInfo) {
        post.zip_file_name = filename; // remember what file the post is from
        session.posts[post.id] = post; // append to the session
    }

    // store data file in opfs
    const dataFileHandle = await dataDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await dataFileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    // get and store file meta
    const reloaded_file = await dataFileHandle.getFile();
    const updatedMeta: FileMetaEntry = { size: reloaded_file.size, name: filename };
    session.file_meta[filename] = updatedMeta;

    await storeSessionToOpfs(session, scope); // write out meta information
}

export function getSessionDataFilesMeta(session: MemorySession | null): FileMeta {
    if (session == null) {
        return {};
    }

    return session.file_meta;
}

export function getSessionDataFilesNames(session: MemorySession | null): string[] {
    return Object.keys(getSessionDataFilesMeta(session));
}

export function getSessionNumberOfDataFileNames(session: MemorySession | null): number {
    return getSessionDataFilesNames(session).length;
}

export function getSessionDataFileCompleteSize(session: MemorySession | null): number {
    const meta = getSessionDataFilesMeta(session);
    let size = 0;

    for (const file_name in meta) {
        size += meta[file_name].size;
    }

    return size;
}

async function storeSessionToOpfs(session: MemorySession, scope: string) {
    const sessionDirHandle = await getSessionDirectoryHandle();
    const sessionFileHandle = await sessionDirHandle.getFileHandle(getSessionMetaFilename(session.name));
    const writable = await sessionFileHandle.createWritable();
    const session_iv_string = session.iv_string;

    // The Memory Session may have been updated. Include the updates into the session to store for the scope
    if (useKeysStore().encryptionOn(scope)) {
        // encrypt posts for storage
        session.session.posts = {};

        for (const post_id_unenc in session.posts) {
            const post_unenc = session.posts[post_id_unenc];

            const post_id_enc = await encryptText(post_id_unenc, session_iv_string, scope);
            const post_enc = await encryptText(
                JSON.stringify(await encryptPostObject(post_unenc, scope)),
                session_iv_string,
                scope
            );

            session.session.posts[post_id_enc] = post_enc;
        }
    } else {
        session.session.posts = session.posts; // set to the overwritten version
    }
    session.session.file_meta = session.file_meta; // set to the overwritten version

    // write out to the filesystem
    await writable.write(JSON.stringify(session.session));
    await writable.close();
}

export function sizeToString(size: number): string {
    return (size * 1e-6).toFixed(3) + " MB";
}
