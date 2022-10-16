let archived_count = 0;
let count = 0;

$(document).ready(() => {
    document.getElementById("generate_url_action").addEventListener("click", () => {
        var subreddit_name = document.getElementById("subreddit_name").value;
        var start_with_post = document.getElementById("start_with_post").value;

        show_scrape_subreddit_url(subreddit_name, start_with_post);
    });

    document.getElementById("copy_to_clipboard").addEventListener("click", () => {
        copy_to_clipboard(document.getElementById("url_output").value);
    });

    document.getElementById("process_posts").addEventListener("click", () => {
        var api_url = document.getElementById("api_url_output").value;

        process_posts(api_url);
    });

    document.getElementById("update_encryption_key").addEventListener("click", () => {
        set_key_to_use("encryption_key", "update_encryption_key");
    });
});

function show_scrape_subreddit_url(subreddit_name = "", start_with_post = "") {
    var start_with_specific_post = start_with_post != "" && start_with_post.length == 6;

    console.log(
        `URL for scraping subreddit "${subreddit_name}" for next set of posts` +
            (start_with_specific_post ? ` after the post with the id ${start_with_post}` : "")
    );

    let url = `https://old.reddit.com/r/${subreddit_name}/?count=${count}${
        start_with_specific_post ? `&after=t3_${start_with_post}` : ""
    }`;
    let api_url = url.replace("old", "api");

    document.getElementById("url_output").value = url;
    document.getElementById("api_url_output").value = api_url;
}

async function process_posts(api_url = "") {
    if (api_url == "") {
        console.error("Need to set url first");
        return;
    }

    const json_response = await fetch(api_url, {
        method: "GET",
    }).then((response) => {
        if (!response.ok) {
            console.error("Network response was not OK");
        }
        return response.json();
    });

    var output_array = [];
    json_response["data"]["children"].forEach((post) => {
        post = post["data"];

        const md_url = media_url(post);

        if (!(post["stickied"] ?? false) && md_url != "") {
            output_array.push({
                id: post["name"], // there is an extra id field. No idea why they are different and what the "t3_" really. Probably post type
                author: post["author"] ?? "",
                direct_link: `https://redd.it/${post["name"]}`,
                title: post["title"] ?? "",
                media_url: md_url,
                series_index: archived_count,
            });
            archived_count += 1;
        }
    });

    // update the fields for the next step
    count += 25;
    document.getElementById("start_with_post").value = json_response["data"]["after"].substr(3);
    document.getElementById("generate_url_action").click();

    console.log("Information processed and advanced for next step");

    // download the images and zip them
    var zip = new JSZip();
    await Promise.all(
        output_array.map(async (post) => {
            var link = post.media_url;

            let blob = await get_media(link);

            const file_extension = link.substring(link.lastIndexOf("."));

            if (encryption_on()) {
                post["iv_string"] = uint8array_to_iv_string(crypto.getRandomValues(new Uint8Array(12)));
            }

            blob = await encrypt_blob(blob, post["iv_string"] ?? ""); // encrypt before hashing
            const hash_string = await hash_blob(blob);

            post["hash_filename"] = hash_string + file_extension;
            post["mime_type"] = blob.type;

            zip.file(hash_string + file_extension, blob);

            return Promise.resolve(1);
        })
    );

    // encrypt lookup json
    if (encryption_on()) {
        for (let i = 0; i < output_array.length; i++) {
            output_array[i].id = await encrypt_text(output_array[i].id, output_array[i]["iv_string"] ?? "");
            output_array[i].author = await encrypt_text(output_array[i].author, output_array[i]["iv_string"] ?? "");
            output_array[i].direct_link = await encrypt_text(output_array[i].direct_link, output_array[i]["iv_string"] ?? "");
            output_array[i].title = await encrypt_text(output_array[i].title, output_array[i]["iv_string"] ?? "");
            output_array[i].media_url = await encrypt_text(output_array[i].media_url, output_array[i]["iv_string"] ?? "");
        }
    }
    zip.file("contents.json", JSON.stringify(output_array));

    zip.generateAsync({ type: "blob" }).then(function (content) {
        // see FileSaver.js
        saveAs(content, "archive_" + String(Date.now()) + (encryption_on() ? "_encrypted" : "") + ".zip");
    });
}

function copy_to_clipboard(text = "") {
    navigator.clipboard.writeText(text);
}

function media_url(json_post) {
    const domain = json_post["domain"] ?? "";

    if (domain == "i.redd.it" || domain == "i.imgur.com") {
        return json_post["url"];
    }

    if (domain == "v.redd.it") {
        return json_post.media?.reddit_video.fallback_url == undefined ? "" : json_post.media?.reddit_video.fallback_url;
    }

    return "";
}

async function get_media(url = "") {
    const lower_url = url.toLowerCase();
    // normal picture or mp4 video
    if (
        lower_url.includes(".jpg") ||
        lower_url.includes(".jpeg") ||
        lower_url.includes(".png") ||
        lower_url.includes(".svg") ||
        lower_url.includes(".mp4") ||
        (lower_url.includes(".gif") && !lower_url.includes(".gifv"))
    ) {
        return await fetch(url, {
            method: "GET",
        }).then((response) => {
            if (!response.ok) {
                console.error("Network response was not OK");
            }
            return response.blob();
        });
    }
    // gifv
    if (lower_url.includes(".gifv")) {
        let gifv_text = await fetch(url, {
            method: "GET",
        }).then((response) => {
            if (!response.ok) {
                console.error("Network response was not OK");
            }
            return response.text();
        });

        const video_url = gifv_text.match(/content="(https:\/\/.+\.mp4)"/)[1]; // 0 is whole match, 1 the capturing group

        return await get_media(video_url);
    }

    console.error("Unprocessable data entity for url" + url);
    return null;
}
