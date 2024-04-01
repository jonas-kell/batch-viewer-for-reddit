import JSZip from "jszip";
import { MemorySession, Post } from "./interfaces";
import useKeysStore from "../stores/keys";
import { decryptPostObject, encryptPostObject } from "./postEncryptionManagement";
import { decryptBlob, encryptBlob, getRandomIvString } from "./encrypt";
import { requestMediaOrApiData } from "./archiveMedia";
import { hashBlob } from "./hash";
import { getSessionPostsDirectoryHandle } from "./opfs";
import useProgressStore from "./../stores/progress";

export const contentsZipFileName = "contents.json";

export async function readInZipFile(file: File, scope: string) {
    let postJson = [] as Post[];

    await JSZip.loadAsync(file).then(async function (zip) {
        let contents = zip.files[contentsZipFileName];
        let json: Post[] = JSON.parse(await contents.async("text"));

        // decrypt stuff
        if (useKeysStore().encryptionOn(scope)) {
            for (let j = 0; j < json.length; j++) {
                json[j] = await decryptPostObject(json[j], scope);
            }
        }

        for (let j = 0; j < json.length; j++) {
            postJson.push(json[j]);
        }
    });

    return postJson;
}

export async function downloadMediaAndGenerateZipFile(
    postsArray: Post[],
    proxyHost: string | null = null,
    scope: string
): Promise<[Blob, number]> {
    useProgressStore().reset();

    var zip = new JSZip();
    await Promise.all(
        postsArray.map(async (post) => {
            useProgressStore().addTarget();

            var link = post.media_url;

            let blob = null;
            try {
                blob = (await requestMediaOrApiData(link, proxyHost)) as Blob | null;
            } catch (_) {}

            if (blob == null) {
                useProgressStore().addError();
                return Promise.resolve(0);
            } else {
                const file_extension = link.substring(link.lastIndexOf("."));

                if (useKeysStore().encryptionOn(scope)) {
                    post["iv_string"] = getRandomIvString();

                    // encrypt before hashing to not be able to hash all files from reddit and compare
                    blob = await encryptBlob(blob, post["iv_string"] ?? "", scope);
                }

                if (blob) {
                    const hash_string = await hashBlob(blob);

                    post["hash_filename"] = hash_string + file_extension;
                    post["mime_type"] = blob.type;

                    zip.file(hash_string + file_extension, blob);

                    useProgressStore().addSuccess();
                    return Promise.resolve(1);
                } else {
                    useProgressStore().addError();
                    return Promise.resolve(0);
                }
            }
        })
    );

    postsArray = postsArray.filter((post) => {
        return post.hash_filename && post.hash_filename != "";
    });

    let downloaded = postsArray.length;

    // encrypt lookup json if necessary
    if (useKeysStore().encryptionOn(scope)) {
        for (let i = 0; i < postsArray.length; i++) {
            postsArray[i] = await encryptPostObject(postsArray[i], scope);
        }
    }

    // add contents meta file to zip
    zip.file(contentsZipFileName, JSON.stringify(postsArray));

    return [await zip.generateAsync({ type: "blob" }), downloaded];
}

export async function loadBlobFromStorage(session: MemorySession, post: Post, scope: string): Promise<Blob | null> {
    const dataDirHandle = await getSessionPostsDirectoryHandle(session.name);

    if (dataDirHandle) {
        const zipFileHandle = await dataDirHandle.getFileHandle(post.zip_file_name);
        const loadedZipFile = await zipFileHandle.getFile();

        // regenerate blob from zip
        let mediaContents = null;
        await JSZip.loadAsync(loadedZipFile).then(async function (zip) {
            mediaContents = (await zip.files[post.hash_filename].async("blob")) as Blob;
        });

        // no idea why this below works :sweat:
        if (mediaContents) {
            mediaContents = mediaContents as Blob;
            mediaContents = mediaContents.slice(0, mediaContents.size, post.mime_type); // write original mime type back into
            mediaContents = await decryptBlob(mediaContents, post.iv_string ?? "", scope);
        }

        return mediaContents;
    }
    return null;
}

export function generateZipFileName(scope: string) {
    return "archive_" + String(Date.now()) + (useKeysStore().encryptionOn(scope) ? "_encrypted" : "") + ".zip";
}
