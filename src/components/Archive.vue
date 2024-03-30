<script setup lang="ts">
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

    //     document.getElementById("url_output").value = url;
    //     document.getElementById("api_url_output").value = api_url;
    // }

    // const file_name = "archive_" + String(Date.now()) + (useKeysStore().encryptionOn(scope) ? "_encrypted" : "") + ".zip";

    // if (sessionToSaveInto == null) {
    //
    // } else {
    //     content.name = file_name;
    //     // store directly into the session
    //     await storeDataFileInSelectedSessionsOpfsFolder(content);

    //     toastr.info("Stored " + file_name + " successfully into the session data files of session: " + selectedSession.name);
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
