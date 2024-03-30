import JSZip from "jszip";
import { MemorySession, Post } from "./interfaces";
import { contentsZipFileName, generateZipFileName, loadBlobFromStorage } from "./zipFilesManagement";
import { encryptBlob, getRandomIvString } from "./encrypt";
import useKeysStore from "../stores/keys";
import { hashBlob } from "./hash";
import { encryptPostObject } from "./postEncryptionManagement";
import useProgressStore from "./../stores/progress";
import { downloadBlob } from "./interactBrowser";
import useSessionsMetaStore from "./../stores/sessionsMeta";
import toastr from "toastr";

export async function exportFromSourceToTarget(
    sessionFrom: MemorySession,
    scopeFrom: string,
    sessionTo: MemorySession | null,
    scopeTo: string
) {
    useProgressStore().reset();

    const sourcePostIds: string[] = Object.keys(sessionFrom.posts);
    let targetPostIds: string[] = [];
    if (sessionTo) {
        targetPostIds = Object.keys(sessionTo.posts);
    }

    let idsToTransfer = sourcePostIds.filter((id) => !targetPostIds.includes(id));

    // TODO notify about skipped entries

    const maxZipSize = 3000000;
    let allPostsProcessed = false;
    const numberOfPostsToProcess = idsToTransfer.length;
    useProgressStore().setTarget(numberOfPostsToProcess);
    let index = 0;

    if (numberOfPostsToProcess == 0) {
        toastr.warning("No posts to transfer");
        return;
    }

    while (!allPostsProcessed) {
        let zip = new JSZip();
        let runningSize = 0;
        let postsAdded = [] as Post[];
        const zipFilename = generateZipFileName(scopeTo);
        while (runningSize < maxZipSize) {
            const post = sessionFrom.posts[idsToTransfer[index]];

            let postContent = await loadBlobFromStorage(sessionFrom, post, scopeFrom);
            if (postContent) {
                runningSize += postContent.size;

                if (runningSize >= maxZipSize && postsAdded.length > 0) {
                    break; // do not attempt to add file
                    // on break, do NOT add one to index, to not skip entries
                }
                index += 1; // increase to prepare for next post definitely next post

                let newIvString = "";
                if (useKeysStore().encryptionOn(scopeTo)) {
                    newIvString = getRandomIvString();

                    // encrypt before hashing to not be able to hash all files from reddit and compare
                    postContent = (await encryptBlob(postContent, newIvString, scopeTo)) as Blob;
                }

                let newHash = await hashBlob(postContent);

                // build new filename
                let newFilename = post.hash_filename;
                if (newFilename.indexOf(".") !== -1) {
                    // Remove everything up to the first "."
                    newFilename = newFilename.substring(newFilename.indexOf("."));
                }
                newFilename = newHash + newFilename;

                zip.file(newFilename, postContent);
                postsAdded.push({
                    author: post.author,
                    direct_link: post.direct_link,
                    hash_filename: newFilename,
                    id: post.id,
                    iv_string: newIvString,
                    media_url: post.media_url,
                    mime_type: post.mime_type,
                    series_index: String(index - 1),
                    subreddit: post.subreddit, // here can be injected for missing legacy data
                    title: post.title,
                    zip_file_name: zipFilename,
                });
                useProgressStore().addSuccess();
            } else {
                useProgressStore().addError();
                index += 1; // next post
            }

            // break out if index too large
            if (index >= numberOfPostsToProcess) {
                allPostsProcessed = true;
                runningSize += 2 * maxZipSize; // make sure to break all loops
            }
        }

        // generate meta data

        // encrypt lookup json if necessary
        if (useKeysStore().encryptionOn(scopeTo)) {
            for (let i = 0; i < postsAdded.length; i++) {
                postsAdded[i] = await encryptPostObject(postsAdded[i], scopeTo);
            }
        }

        // add contents meta file to zip
        zip.file(contentsZipFileName, JSON.stringify(postsAdded));

        const generatedZipFile = await zip.generateAsync({ type: "blob" });

        if (sessionTo) {
            // Import into session
            (generatedZipFile as any).name = zipFilename;
            const file = generatedZipFile as File;
            await useSessionsMetaStore().addFileToSession(sessionTo, file, scopeTo);
            toastr.info("Stored " + zipFilename + " into the session data files of session: " + sessionTo.name);
        } else {
            // Download
            console.log(zipFilename);
            downloadBlob(generatedZipFile, zipFilename);
        }
    }

    if (sessionTo) {
        await useSessionsMetaStore().reParseLocalSessionCacheFromFiles(scopeTo);
    }
}
