import { MemorySession, Post } from "./interfaces";
import { downloadMediaAndGenerateZipFile } from "./zipFilesManagement";
import toastr from "toastr";

export interface DownloadSessionState {
    start_with_post: string;
    count: number;
    archived_count: number;
    subreddit_name: string;
}

interface RedditApiResponse {
    data: {
        children: RedditApiPost[];
        after: string;
    };
}

interface RedditApiPost {
    data: {
        name: string;
        domain?: string;
        stickied?: boolean;
        url?: string;
        media?: {
            reddit_video?: {
                fallback_url?: string;
            };
        };
        subreddit_name_prefixed?: string;
        title?: string;
        author?: string;
    };
}

export function generateRedditApiURL(downloadState: DownloadSessionState, humanLink: boolean = false) {
    let url = `https://old.reddit.com/r/${downloadState.subreddit_name}/?count=${downloadState.count}${
        downloadState.start_with_post ? `&after=t3_${downloadState.start_with_post}` : ""
    }`;
    let APIurl = url.replace("old", "api");

    if (humanLink) {
        return url;
    } else {
        return APIurl;
    }
}

export async function processPosts(
    session: MemorySession | null,
    downloadState: DownloadSessionState,
    proxyHost: string | null = null,
    scope: string
): Promise<[Blob, number]> {
    const redditApiURL = generateRedditApiURL(downloadState);

    const jsonResponse: RedditApiResponse | null = (await requestMediaOrApiData(
        redditApiURL,
        proxyHost
    )) as RedditApiResponse | null; // cast should work here

    if (!jsonResponse) {
        toastr.error("API Call failed. No POST json received");
        throw Error("Processing failed because missing API response");
    }

    let currentIds: string[] = [];
    if (session != null) {
        currentIds = Object.keys(session.posts);
    }

    var outputArray: Post[] = [];
    jsonResponse["data"]["children"].forEach((post) => {
        const postMediaURL = mediaURL(post);

        const id = post["data"]["name"]; // there is an extra id field. No idea why they are different and what the "t3_" really. Probably post type

        if (!(post["data"]["stickied"] ?? false) && postMediaURL != "") {
            // not include multiple times
            if (!currentIds.includes(id)) {
                outputArray.push({
                    id: id,
                    author: post["data"]["author"] ?? "",
                    direct_link: `https://redd.it/${post["data"]["name"]}`,
                    title: post["data"]["title"] ?? "",
                    subreddit: post["data"]["subreddit_name_prefixed"] ?? "",
                    media_url: postMediaURL,
                    series_index: String(downloadState.archived_count),
                    hash_filename: "",
                    iv_string: "",
                    mime_type: "",
                    zip_file_name: "",
                });
                downloadState.archived_count += 1;
            }
        }
    });

    // update the fields for the next step
    downloadState.count += 25;
    downloadState.start_with_post = jsonResponse["data"]["after"].substring(3); // removes the t3_ at the beginning

    // download the images and zip them
    const zipBlobAndNumber = await downloadMediaAndGenerateZipFile(outputArray, proxyHost, scope);

    return zipBlobAndNumber;
}

function mediaURL(jsonPost: RedditApiPost): string {
    const domain = jsonPost["data"]["domain"] ?? "";

    if (domain == "i.redd.it" || domain == "i.imgur.com") {
        return jsonPost["data"]["url"] ?? "";
    }

    if (domain == "v.redd.it") {
        return jsonPost["data"].media?.reddit_video?.fallback_url == undefined
            ? ""
            : jsonPost["data"].media?.reddit_video?.fallback_url;
    }

    return "";
}

export async function requestMediaOrApiData(url = "", proxyHost: string | null = null): Promise<Blob | RedditApiResponse | null> {
    const lowerURL = url.toLowerCase();

    let URLToRequest = url;
    if (proxyHost != null && proxyHost != "") {
        URLToRequest = `https://${proxyHost}:9376/resource?url=${encodeURIComponent(url)}`;
    }

    // normal picture or mp4 video
    if (
        lowerURL.includes(".jpg") ||
        lowerURL.includes(".jpeg") ||
        lowerURL.includes(".png") ||
        lowerURL.includes(".svg") ||
        lowerURL.includes(".mp4") ||
        (lowerURL.includes(".gif") && !lowerURL.includes(".gifv"))
    ) {
        return await fetch(URLToRequest, {
            method: "GET",
        }).then((response) => {
            if (!response.ok) {
                console.error("Network response was not OK");
                return null;
            }
            return response.blob();
        });
    }
    // gifv
    if (lowerURL.includes(".gifv")) {
        let gifvText = await fetch(URLToRequest, {
            method: "GET",
        }).then((response) => {
            if (!response.ok) {
                console.error("Network response was not OK");
                return null;
            }
            return response.text();
        });

        if (!gifvText) {
            return null;
        }
        const videoURL = (gifvText.match(/content="(https:\/\/.+\.mp4)"/) ?? ["", ""])[1]; // 0 is whole match, 1 the capturing group
        return await requestMediaOrApiData(videoURL, proxyHost);
    }

    // api call (json text assumed)
    if (lowerURL.includes("api.reddit")) {
        const jsonResponse = await fetch(URLToRequest, {
            method: "GET",
        }).then((response) => {
            if (!response.ok) {
                console.error("Network response was not OK");
                return null;
            }
            return response.json();
        });

        return jsonResponse as RedditApiResponse | null;
    }

    toastr.error("Unprocessable data entity for url " + url);
    return null;
}
