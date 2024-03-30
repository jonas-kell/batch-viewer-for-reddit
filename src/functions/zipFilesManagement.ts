import JSZip from "jszip";
import { Post } from "./interfaces";
import useKeysStore from "../stores/keys";
import { decryptPostObject } from "./postEncryptionManagement";

const contentsZipFileName = "contents.json";

export async function readInZipFile(file: File, scope: string = "page") {
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
