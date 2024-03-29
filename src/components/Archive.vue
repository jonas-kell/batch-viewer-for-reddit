<script setup lang="ts">
    // let archived_count = 0;
    // let count = 0;

    // $(document).ready(async () => {
    //     document.getElementById("generate_url_action").addEventListener("click", () => {
    //         var subreddit_name = document.getElementById("subreddit_name").value;
    //         var start_with_post = document.getElementById("start_with_post").value;

    //         show_scrape_subreddit_url(subreddit_name, start_with_post);
    //     });

    //     document.getElementById("copy_to_clipboard").addEventListener("click", () => {
    //         copy_to_clipboard(document.getElementById("url_output").value);
    //     });

    //     document.getElementById("process_posts").addEventListener("click", () => {
    //         var api_url = document.getElementById("api_url_output").value;

    //         process_posts(api_url);
    //     });

    //     document.getElementById("update_encryption_key").addEventListener("click", async () => {
    //         await set_key_to_use("encryption_key", "update_encryption_key");

    //         selectSession(); // clear page scope session

    //         await recreateSessionsMeta();
    //     });

    //     $("#proxy_address").on("change", async function () {
    //         let value = $(this).val();

    //         await set_proxy_url(value);
    //     });
    //     let cached_proxy_url = localStorage.getItem("proxy_url");
    //     if (cached_proxy_url != undefined && cached_proxy_url) {
    //         set_proxy_url(cached_proxy_url);
    //     }
    // });

    // async function set_proxy_url(url) {
    //     $("#proxy_address").val(url);

    //     await fetch(`https://${url}:9376/check`, {
    //         method: "GET",
    //     })
    //         .then(async (response) => {
    //             if (response.ok) {
    //                 const jsonData = await response.json();

    //                 if (jsonData.success != undefined && jsonData.success) {
    //                     toastr.success("Connected to Proxy Server");
    //                     $("#proxy_address").css("background", "green");
    //                     return;
    //                 }
    //             }
    //             $("#proxy_address").css("background", "red");
    //             toastr.error("Proxy Server not found");
    //         })
    //         .catch(() => {
    //             $("#proxy_address").css("background", "red");
    //             toastr.error("Proxy Server not found");
    //         });

    //     localStorage.setItem("proxy_url", url);
    // }

    // function show_scrape_subreddit_url(subreddit_name = "", start_with_post = "") {
    //     var start_with_specific_post = start_with_post != "" && (start_with_post.length == 6 || start_with_post.length == 7); // funny, this changed recently and broke the app

    //     toastr.info(
    //         `URL for scraping subreddit "${subreddit_name}" for next set of posts` +
    //             (start_with_specific_post ? ` after the post with the id ${start_with_post}` : "")
    //     );

    //     let url = `https://old.reddit.com/r/${subreddit_name}/?count=${count}${
    //         start_with_specific_post ? `&after=t3_${start_with_post}` : ""
    //     }`;
    //     let api_url = url.replace("old", "api");

    //     document.getElementById("url_output").value = url;
    //     document.getElementById("api_url_output").value = api_url;
    // }

    // async function process_posts(api_url = "") {
    //     if (api_url == "") {
    //         toastr.error("Need to set url first");
    //         return;
    //     }

    //     const json_response = await fetch(api_url, {
    //         method: "GET",
    //     }).then((response) => {
    //         if (!response.ok) {
    //             console.error("Network response was not OK");
    //         }
    //         return response.json();
    //     });

    //     var output_array = [];
    //     json_response["data"]["children"].forEach((post) => {
    //         post = post["data"];

    //         const md_url = media_url(post);

    //         if (!(post["stickied"] ?? false) && md_url != "") {
    //             output_array.push({
    //                 id: post["name"], // there is an extra id field. No idea why they are different and what the "t3_" really. Probably post type
    //                 author: post["author"] ?? "",
    //                 direct_link: `https://redd.it/${post["name"]}`,
    //                 title: post["title"] ?? "",
    //                 subreddit: post["subreddit_name_prefixed"] ?? "",
    //                 media_url: md_url,
    //                 series_index: archived_count,
    //             });
    //             archived_count += 1;
    //         }
    //     });

    //     // update the fields for the next step
    //     count += 25;
    //     document.getElementById("start_with_post").value = json_response["data"]["after"].substr(3);
    //     document.getElementById("generate_url_action").click();

    //     toastr.info("Information processed and advanced for next step");

    //     // download the images and zip them
    //     var zip = new JSZip();
    //     await Promise.all(
    //         output_array.map(async (post) => {
    //             var link = post.media_url;

    //             let blob = await get_media(link);

    //             const file_extension = link.substring(link.lastIndexOf("."));

    //             if (encryptionOn()) {
    //                 post["iv_string"] = getRandomIvString();
    //             }

    //             blob = await encryptBlob(blob, post["iv_string"] ?? ""); // encrypt before hashing
    //             const hash_string = await hashBlob(blob);

    //             post["hash_filename"] = hash_string + file_extension;
    //             post["mime_type"] = blob.type;

    //             zip.file(hash_string + file_extension, blob);

    //             return Promise.resolve(1);
    //         })
    //     );

    //     // encrypt lookup json
    //     if (encryptionOn()) {
    //         for (let i = 0; i < output_array.length; i++) {
    //             output_array[i] = await encryptPostObject(output_array[i]);
    //         }
    //     }
    //     zip.file("contents.json", JSON.stringify(output_array));

    //     zip.generateAsync({ type: "blob" }).then(async function (content) {
    //         const file_name = "archive_" + String(Date.now()) + (encryptionOn() ? "_encrypted" : "") + ".zip";

    //         let selectedSession = getSelectedSession();
    //         if (selectedSession == null) {
    //             // Download see FileSaver.js
    //             saveAs(content, file_name);
    //             toastr.info("Downloaded: " + file_name);
    //         } else {
    //             content.name = file_name;
    //             // store directly into the session
    //             await storeDataFileInSelectedSessionsOpfsFolder(content);

    //             toastr.info(
    //                 "Stored " + file_name + " successfully into the session data files of session: " + selectedSession.name
    //             );
    //         }
    //     });
    // }

    // function copy_to_clipboard(text = "") {
    //     navigator.clipboard.writeText(text);
    // }

    // function media_url(json_post) {
    //     const domain = json_post["domain"] ?? "";

    //     if (domain == "i.redd.it" || domain == "i.imgur.com") {
    //         return json_post["url"];
    //     }

    //     if (domain == "v.redd.it") {
    //         return json_post.media?.reddit_video.fallback_url == undefined ? "" : json_post.media?.reddit_video.fallback_url;
    //     }

    //     return "";
    // }

    // async function get_media(url = "") {
    //     const lower_url = url.toLowerCase();

    //     const proxy_address = $("#proxy_address").val();
    //     if (proxy_address != null && process_posts != "") {
    //         url = `https://${proxy_address}:9376/resource?url=${encodeURIComponent(url)}`;
    //     }

    //     // normal picture or mp4 video
    //     if (
    //         lower_url.includes(".jpg") ||
    //         lower_url.includes(".jpeg") ||
    //         lower_url.includes(".png") ||
    //         lower_url.includes(".svg") ||
    //         lower_url.includes(".mp4") ||
    //         (lower_url.includes(".gif") && !lower_url.includes(".gifv"))
    //     ) {
    //         return await fetch(url, {
    //             method: "GET",
    //         }).then((response) => {
    //             if (!response.ok) {
    //                 console.error("Network response was not OK");
    //             }
    //             return response.blob();
    //         });
    //     }
    //     // gifv
    //     if (lower_url.includes(".gifv")) {
    //         let gifv_text = await fetch(url, {
    //             method: "GET",
    //         }).then((response) => {
    //             if (!response.ok) {
    //                 console.error("Network response was not OK");
    //             }
    //             return response.text();
    //         });

    //         const video_url = gifv_text.match(/content="(https:\/\/.+\.mp4)"/)[1]; // 0 is whole match, 1 the capturing group

    //         return await get_media(video_url);
    //     }

    //     toastr.error("Unprocessable data entity for url " + url);
    //     return null;
    // }
</script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    This uses the public part of the reddit api to get the information about posts. Be responsible and slow with your requests or
    you might get rate limited or blocked.

    <h2>Archive page</h2>
    <div>
        Proxy Server (See `README.md`, Needed because of CORS):
        <br />
        https://<input type="text" name="proxy_address" id="proxy_address" />:9376/
        <br />
        <br />
        Subreddit to scrape<br />
        <input type="text" id="subreddit_name" placeholder="mathmemes" value="mathmemes" /><br />
        Post to start with (shortlink shown by "old.reddit.com" format, e.g. "y3215w" in the case of https://redd.it/y3215w)<br />
        <input type="text" id="start_with_post" />
        <button id="generate_url_action">Generate URL</button>

        <br />
        <br />
        URL of the posts (old.reddit) because easier to see<br />
        <input type="text" id="url_output" disabled value="" style="width: 60%" />
        <button id="copy_to_clipboard">Copy to clipboard</button>
        <br />
        URL of the corresponding api endpoint<br />
        <input type="text" id="api_url_output" disabled value="" style="width: 60%" />

        <button id="process_posts" style="color: darkcyan">Process one set of Posts</button>

        <br />
        <br />
        Encryption key (If set, the output will be encrypted):<br />
        <input type="password" id="encryption_key" value="" style="width: 40%" placeholder="Encryption Key" />
        <button id="update_encryption_key">Update</button>

        <br />
        <br />
        Where to put the results:
        <fieldset>
            <input
                type="radio"
                id="default_page"
                name="sessions_select_page"
                value="default"
                class="selects_session"
                scope="page"
                checked
            />
            <label for="default_page">Download</label>
            <br />
            <div class="sessions_radio_buttons" scope="page"></div>
        </fieldset>
    </div>
</template>

<style scoped></style>
