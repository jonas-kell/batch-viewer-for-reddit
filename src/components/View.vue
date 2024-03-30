<script setup lang="ts">
    import PasswordField from "./PasswordField.vue";

    // let rendered_media_cache = {};

    // $(document).ready(() => {
    //     document.getElementById("update_decryption_key").addEventListener("click", async () => {
    //         await set_key_to_use("decryption_key", "update_decryption_key");

    //         selectSession(); // clear page scope session

    //         await recreateSessionsMeta();

    //         // send reset command
    //         $("#load_files_from_session").click();
    //     });

    //     $(document).on("click", "#load_files_from_session", () => {
    //         clear_rendered_media_cache();

    //         // reset display
    //         reset_display();
    //     });

    //     $(document).on("click", ".view_prev", () => {
    //         let number = parseInt(document.getElementById("current_number_top").value);

    //         select_post(number - 1);
    //     });

    //     $(document).on("click", ".view_next", () => {
    //         let number = parseInt(document.getElementById("current_number_top").value);

    //         select_post(number + 1);
    //     });

    //     $("#post_width").on("change", () => {
    //         clear_rendered_media_cache();
    //         select_post(document.getElementById("current_number_top").value);
    //     });
    // });

    // async function select_post(number) {
    //     if (number >= 0 && number < getNumberOfPosts()) {
    //         // ok region
    //     } else {
    //         number = 0;
    //     }

    //     $(".current_number").each((index, element) => {
    //         $(element).val(number);
    //     });

    //     await display_post(getPostJson(number));

    //     // cache next posts asyncronously in the background
    //     const time_difference = 400;
    //     const number_of_posts_to_cache = 3;
    //     function cache_in_background(post_nr, offset) {
    //         setTimeout(() => {
    //             render_post(getPostJson((post_nr + offset) % getNumberOfPosts()));
    //         }, time_difference * offset);
    //     }
    //     for (let i = 1; i <= number_of_posts_to_cache; i++) {
    //         cache_in_background(number, i);
    //     }
    // }

    // async function display_post(json_post) {
    //     let browser_target = document.getElementById("view_target");
    //     let cache_region = document.getElementById("view_area_cache");

    //     const rendered_element = await render_post(json_post);

    //     // move no longer needed elements out
    //     [...browser_target.children].forEach((child) => {
    //         cache_region.appendChild(child);
    //     });

    //     // move new element in
    //     browser_target.appendChild(rendered_element);
    // }

    // // caches the result
    // async function render_post(json_post) {
    //     if (json_post == null) {
    //         return;
    //     }

    //     const filename = json_post.hash_filename;
    //     const cache_index = (json_post.zip_file_name ?? "") + filename;

    //     // if already cached, return immediately
    //     if (Object.keys(rendered_media_cache).includes(cache_index)) {
    //         return rendered_media_cache[cache_index][1];
    //     }

    //     // not cached, so create new
    //     let title = json_post.title;
    //     let author = json_post.author;
    //     let link = json_post.direct_link;
    //     let subreddit = json_post.subreddit ?? "";

    //     // retrieve blob
    //     let media_contents = await retrieve_media_content(json_post);

    //     const style = `style="width: ${$("#post_width").val()}%;"`;

    //     let content = "";
    //     // generate media element
    //     if (media_contents.type.includes("video")) {
    //         content = `<video ${style} autoplay muted controls loop><source src="${await blobToBase64(
    //             media_contents
    //         )}">Your browser does not support the video tag.</video>`;
    //     } else {
    //         // assume image mime type
    //         content = `<img src="${await blobToBase64(media_contents)}"  ${style}></img>`;
    //     }

    //     // set html output
    //     const cache_element = document.createElement("div");
    //     cache_element.innerHTML = `<h4>${subreddit}</h4><h2>${title}</h2>${content}<h4>${author}</h4><span>${link}</span><div style="position: absolute; top:3em; bottom:6em; left: 0; right: 60%;" class="view_prev"></div><div style="position: absolute; top:3em; bottom:6em; right: 0; left: 60%;" class="view_next"></div>`;

    //     // append to dom
    //     let cache_region = document.getElementById("view_area_cache");
    //     cache_region.appendChild(cache_element);

    //     // element not in cache. Add before returning
    //     add_element_to_media_cache(cache_index, cache_element);

    //     return cache_element;
    // }

    // function add_element_to_media_cache(cache_index, cache_element) {
    //     // add element
    //     rendered_media_cache[cache_index] = [0, cache_element]; // [age, cache_element]

    //     // age all entries
    //     for (const media_key in rendered_media_cache) {
    //         rendered_media_cache[media_key][0]++;
    //     }

    //     // delete too old entries
    //     Object.keys(rendered_media_cache).forEach((media_key) => {
    //         if (rendered_media_cache[media_key][0] > 8) {
    //             rendered_media_cache[media_key][1].remove(); // remove from dom
    //             delete rendered_media_cache[media_key]; // remove js
    //         }
    //     });
    // }

    // function clear_rendered_media_cache() {
    //     let cache_region = document.getElementById("view_area_cache");
    //     let browser_target = document.getElementById("view_target");

    //     // delete dom nodes
    //     var child = cache_region.lastElementChild;
    //     while (child) {
    //         cache_region.removeChild(child);
    //         child = cache_region.lastElementChild;
    //     }
    //     child = browser_target.lastElementChild;
    //     while (child) {
    //         browser_target.removeChild(child);
    //         child = browser_target.lastElementChild;
    //     }

    //     // clear js cache
    //     rendered_media_cache = {};
    // }

    // // returns a typed media blob
    // async function retrieve_media_content(json_post) {
    //     // load zip from file system
    //     const dataDirHandle = await getSessionPostsDirectoryHandle();
    //     const zipFileHandle = await dataDirHandle.getFileHandle(json_post.zip_file_name);
    //     const loaded_zip_file = await zipFileHandle.getFile();

    //     // regenerate blob from zip
    //     let media_contents = null;
    //     await JSZip.loadAsync(loaded_zip_file).then(async function (zip) {
    //         media_contents = await zip.files[json_post.hash_filename].async("blob");
    //     });
    //     media_contents = media_contents.slice(0, media_contents.size, json_post.mime_type); // write original mime type back into
    //     media_contents = await decryptBlob(media_contents, json_post.iv_string ?? "");

    //     return media_contents;
    // }

    // function reset_display() {
    //     // set max number display
    //     $(".max_number").each((index, element) => {
    //         $(element).html(getNumberOfPosts() - 1);
    //     });

    //     // get image files from zip and append to display
    //     if (getSelectedSession() != null) {
    //         select_post(0);
    //     }
    // }

    // function getPostJson(index) {
    //     let session = getSelectedSession();

    //     if (session == null) {
    //         return null;
    //     } else {
    //         return session.posts[Object.keys(session.posts)[index]];
    //     }
    // }

    // function getNumberOfPosts() {
    //     let session = getSelectedSession();

    //     if (session == null) {
    //         return 0;
    //     } else {
    //         return Object.keys(session.posts).length;
    //     }
    // }
</script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    <h2>Display Contents</h2>
    <br />
    <PasswordField scope="page" hint="Decryption Key"></PasswordField>

    <br />
    <br />
    Which Session to load:
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
        <label for="default_page">Please choose</label>
        <br />
        <div class="sessions_radio_buttons" scope="page"></div>
    </fieldset>
    <br />
    <br />
    Randomized import:
    <input type="checkbox" id="randomize" checked />
    &nbsp&nbsp Image Width:
    <input type="number" id="post_width" value="100" min="10" max="100" step="10" />
    <button id="load_files_from_session" style="display: none"></button>

    <br />
    <br />
    <div style="width: 100%; text-align: center">
        <div style="width: 60%; margin: auto">
            <input type="number" value="0" style="width: 20%" id="current_number_top" class="current_number" /> /
            <span id="max_number_top" class="max_number">0</span>
            <span style="float: left; border: 1px solid black; cursor: pointer" id="view_prev_top" class="view_prev">prev</span>
            <span style="float: right; border: 1px solid black; cursor: pointer" id="view_next_top" class="view_next">next</span>
        </div>
    </div>
    <br />
    <div style="width: 100%; text-align: center; min-height: 2cm; border: 2px solid black; position: relative">
        <div id="view_target" style="width: 98%; text-align: center; position: relative; margin: auto"></div>
        <div style="visibility: hidden" hidden id="view_area_cache"></div>
    </div>
    <br />
    <div style="width: 100%; text-align: center">
        <div style="width: 60%; margin: auto">
            <input type="number" value="0" style="width: 20%" id="current_number_bottom" class="current_number" disabled /> /
            <span id="max_number_bottom" class="max_number">0</span>
            <span style="float: left; border: 1px solid black; cursor: pointer" id="view_prev_bottom" class="view_prev"
                >prev</span
            >
            <span style="float: right; border: 1px solid black; cursor: pointer" id="view_next_bottom" class="view_next"
                >next</span
            >
        </div>
    </div>
</template>

<style scoped></style>
