import { decryptText, encryptText } from "./encrypt";
import { Post } from "./interfaces";

const unEncryptedPostKeys = ["hash_filename", "iv_string", "mime_type", "series_index", "zip_file_name"] as (
    | "hash_filename"
    | "iv_string"
    | "mime_type"
    | "series_index"
    | "zip_file_name"
)[];

const encryptedPostObjects = ["id", "author", "direct_link", "title", "media_url", "subreddit"] as (
    | "id"
    | "author"
    | "direct_link"
    | "title"
    | "media_url"
    | "subreddit"
)[];

export async function decryptPostObject(post: Post, scope: string) {
    let result_post = {} as Post;

    // clone
    for (const keyword of unEncryptedPostKeys) {
        if (post[keyword] != undefined) {
            result_post[keyword] = post[keyword];
        }
    }

    // decrypt
    for (const keyword of encryptedPostObjects) {
        let result = "";
        try {
            result = await decryptText(post[keyword], post["iv_string"] ?? "", scope);
        } catch (error) {
            if (keyword == "id") {
                throw new Error("Current Key not suited for file decryption");
            }
        }
        result_post[keyword] = result;
    }

    return result_post;
}

export async function encryptPostObject(post: Post, scope: string) {
    let result_post = {} as Post;

    // clone
    for (const keyword of unEncryptedPostKeys) {
        if (post[keyword] != undefined) {
            result_post[keyword] = post[keyword];
        }
    }

    // decrypt
    for (const keyword of encryptedPostObjects) {
        result_post[keyword] = await encryptText(post[keyword], post["iv_string"] ?? "", scope);
    }

    return result_post;
}
