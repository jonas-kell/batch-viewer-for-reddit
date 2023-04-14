let sessionsMeta = {};
let selected_session_name = "";

async function getSessionDirectoryHandle() {
    const originPrivateFileSystem = await navigator.storage.getDirectory();
    const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle("session-storage", { create: true });

    return sessionDirHandle;
}

async function getSessionPostsDirectoryHandle(session_name = "") {
    if (session_name == "") {
        session_name = selected_session_name;
    }

    if (session_name != "") {
        const originPrivateFileSystem = await navigator.storage.getDirectory();
        const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle(session_name.split(".")[0], {
            create: true,
        });

        return sessionDirHandle;
    }
    return null;
}

function selectSession(session_name = "") {
    selected_session_name = "";
    if (session_name == "") {
        return false;
    }

    if (Object.keys(sessionsMeta).includes(session_name)) {
        if (sessionsMeta[session_name].can_be_decrypted ?? false) {
            selected_session_name = session_name;
            return true;
        } else {
            toastr.error("Encrypted session can not be selected without key");
        }
    } else {
        if (session_name != "default") {
            toastr.error("Key not found in sessionsMeta cache");
        } else {
            toastr.success("Selected default operation");
        }
    }
    return false;
}

function getSelectedSession() {
    return getSession(selected_session_name);
}

function getSession(session_name) {
    let res = sessionsMeta[session_name];

    if (res != undefined) {
        return res;
    }
    return null;
}

function getSelectedSessionName() {
    return selected_session_name;
}

async function recreateSessionsMeta() {
    const sessionDirHandle = await getSessionDirectoryHandle();

    sessionsMeta = {};

    // rebuild sessions array
    for await (const entry of sessionDirHandle.values()) {
        if ((entry.kind = "file" && entry.name.match(/Session_\d*(_encrypted)?.json/g))) {
            const file = await entry.getFile();

            // parse info
            let parsedSession = JSON.parse(await file.text());
            const is_encrypted = parsedSession.encrypted;
            const session_iv_string = parsedSession.iv_string;
            let throws_error = false;
            try {
                await decrypt_text(parsedSession.encryption_test, session_iv_string);
            } catch (error) {
                throws_error = true;
            }
            const can_be_decrypted = !is_encrypted || (is_encrypted && encryption_on() && !throws_error);

            // decrypt posts
            let posts = {};
            if (encryption_on() && can_be_decrypted && is_encrypted) {
                // need to decrypt
                for (const post_id_enc in parsedSession.posts) {
                    const post_id = await decrypt_text(post_id_enc, session_iv_string);
                    const post_object = JSON.parse(await decrypt_text(parsedSession.posts[post_id_enc], session_iv_string));
                    posts[post_id] = await decryptPostObject(post_object);
                }
            } else {
                // just do a copy
                posts = JSON.parse(JSON.stringify(parsedSession.posts));
            }

            // store results
            sessionsMeta[parsedSession.name] = {
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

    return sessionsMeta;
}

async function createSession() {
    const filename = "Session_" + String(Date.now()) + (encryption_on() ? "_encrypted" : "") + ".json";
    const sessionDirHandle = await getSessionDirectoryHandle();
    const sessionFileHandle = await sessionDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await sessionFileHandle.createWritable();
    const iv_string = uint8array_to_iv_string(crypto.getRandomValues(new Uint8Array(12)));

    await writable.write(
        `{"name": "${filename}", "encrypted": ${encryption_on()}, "encryption_test": "${await encrypt_text(
            String(Math.random()),
            iv_string
        )}", "iv_string": "${iv_string}", "posts": {}, "file_meta": {}}`
    );
    await writable.close();
}

async function deleteSession(fileNameToDelete) {
    const sessionDirHandle = await getSessionDirectoryHandle();
    await sessionDirHandle.removeEntry(fileNameToDelete);

    const dataDirHandle = await getSessionPostsDirectoryHandle(fileNameToDelete);
    await (await navigator.storage.getDirectory()).removeEntry(dataDirHandle.name, { recursive: true });

    toastr.success(`Deleted Session ${fileNameToDelete}`);
}

async function storeDataFileInSelectedSessionsOpfsFolder(file) {
    const filename = file.name;
    const dataDirHandle = await getSessionPostsDirectoryHandle();

    // check if can be processed
    let session = getSelectedSession();
    if (session == null) {
        toastr.error("No session selected, aborting");
        return;
    }
    let filenames = await getCurrentSessionDataFilesNames();
    if (filenames.includes(filename)) {
        toastr.warning("Already included file: " + filename);
        return;
    }
    const file_encrypted = filename.includes("_encrypted");
    const encryption_enabled = encryption_on();
    if (encryption_enabled != file_encrypted) {
        toastr.error("Encryption mismatch for file: " + filename);
        return;
    }

    // process meta
    let meta_info = null;
    try {
        meta_info = await readInZipFile(file);
    } catch (error) {
        toastr.error("Decryption Key mismatch for file: " + filename);
        return;
    }

    // append posts
    for (let post of meta_info) {
        post.zip_file_name = filename; // remember what file the post is from
        session.posts[post.id] = post;
    }

    // store file in opfs
    const dataFileHandle = await dataDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await dataFileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    // get and store file meta
    const reloaded_file = await dataFileHandle.getFile();
    session.file_meta[filename] = { size: reloaded_file.size, name: filename };

    await storeCurrentSessionToOpfs();
}

async function getSessionDataFilesMeta(session_name) {
    let session = getSession(session_name);
    if (session == null) {
        return {};
    }

    return session.file_meta;
}

async function getSessionDataFilesNames(session_name) {
    return Object.keys(await getSessionDataFilesMeta(session_name));
}

async function getCurrentSessionDataFilesNames() {
    return await getSessionDataFilesNames(getSelectedSessionName());
}

async function getSessionNumberOfDataFileNames(session_name) {
    return (await getSessionDataFilesNames(session_name)).length;
}

async function getSessionDataFileCompleteSize(session_name) {
    const meta = await getSessionDataFilesMeta(session_name);
    let size = 0;

    for (const file_name in meta) {
        size += meta[file_name].size;
    }

    return size;
}

async function storeCurrentSessionToOpfs() {
    let session = getSelectedSession();
    if (session == null) {
        throw new Error("No Session selected");
    }

    const filename = getSelectedSessionName();
    const sessionDirHandle = await getSessionDirectoryHandle();
    const sessionFileHandle = await sessionDirHandle.getFileHandle(filename);
    const writable = await sessionFileHandle.createWritable();
    const session_iv_string = session.iv_string;

    if (encryption_on()) {
        // encrypt posts for storage
        session.session.posts = {};

        for (const post_id_unenc in session.posts) {
            const post_unenc = session.posts[post_id_unenc];

            const post_id_enc = await encrypt_text(post_id_unenc, session_iv_string);
            const post_enc = await encrypt_text(JSON.stringify(await encryptPostObject(post_unenc)), session_iv_string);

            session.session.posts[post_id_enc] = post_enc;
        }
    } else {
        session.session.posts = session.posts; // set to the overwritten version
    }

    session.session.file_meta = session.file_meta; // set to the overwritten version

    await writable.write(JSON.stringify(session.session));
    await writable.close();

    toastr.success("Session data stored to File System");
}

async function readInZipFile(file) {
    let post_json = [];

    await JSZip.loadAsync(file).then(async function (zip) {
        let contents = zip.files["contents.json"];
        let json = JSON.parse(await contents.async("text"));

        // decrypt stuff
        if (encryption_on()) {
            for (let j = 0; j < json.length; j++) {
                json[j] = await decryptPostObject(json[j]);
            }
        }

        for (let j = 0; j < json.length; j++) {
            post_json.push(json[j]);
        }
    });

    return post_json;
}

async function decryptPostObject(post) {
    let result_post = {};

    // clone
    for (const keyword of ["hash_filename", "iv_string", "mime_type", "series_index", "zip_file_name"]) {
        if (post[keyword] != undefined) {
            result_post[keyword] = post[keyword];
        }
    }

    // decrypt
    for (const keyword of ["id", "author", "direct_link", "title", "media_url", "subreddit"]) {
        let result = "";
        try {
            result = await decrypt_text(post[keyword], post["iv_string"] ?? "");
        } catch (error) {
            if (keyword == "id") {
                throw new Error("Current Key not suited for file decryption");
            }
        }
        result_post[keyword] = result;
    }

    return result_post;
}

async function encryptPostObject(post) {
    let result_post = {};

    // clone
    for (const keyword of ["hash_filename", "iv_string", "mime_type", "series_index", "zip_file_name"]) {
        if (post[keyword] != undefined) {
            result_post[keyword] = post[keyword];
        }
    }

    // decrypt
    for (const keyword of ["id", "author", "direct_link", "title", "media_url", "subreddit"]) {
        result_post[keyword] = await encrypt_text(post[keyword], post["iv_string"] ?? "");
    }

    return result_post;
}

function sizeToString(size) {
    return (size * 1e-6).toFixed(3) + " MB";
}
