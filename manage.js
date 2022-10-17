let control_json = [];
let zip_file_array = [];
let decrypted_media_cache = {};

$(document).ready(() => {
    document.getElementById("update_decryption_key").addEventListener("click", () => {
        set_key_to_use("decryption_key", "update_decryption_key");
    });

    document.getElementById("open_zip").addEventListener("click", async () => {
        let fileHandle;
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();

        // reset storage containers
        zip_file_array = [1];
        control_json = [];
        decrypted_media_cache = {};

        // read in zip file
        await read_in_zip_file(file, 0);

        // sort or randomize order
        reorder_control_array();

        // reset display
        reset_display();
    });

    $("#zip_filepicker").on("change", async function (evt) {
        var files = evt.target.files;
        const nr_zip_files = files.length;

        // reset storage containers
        zip_file_array = Array.from(Array(nr_zip_files).keys());
        control_json = [];
        decrypted_media_cache = {};

        // read in zip files
        for (var i = 0; i < nr_zip_files; i++) {
            await read_in_zip_file(files[i], i);
        }

        // sort or randomize order
        reorder_control_array();

        // reset display
        reset_display();
    });

    $(document).on("click", ".view_prev", () => {
        let number = parseInt(document.getElementById("current_number_top").value);

        select_post(number - 1);
    });

    $(document).on("click", ".view_next", () => {
        let number = parseInt(document.getElementById("current_number_top").value);

        select_post(number + 1);
    });

    $("#post_width").on("change", () => {
        select_post(document.getElementById("current_number_top").value);
    });
});

async function read_in_zip_file(file, index) {
    await JSZip.loadAsync(file).then(async function (zip) {
        zip_file_array[index] = zip; // push directly into permanent zip file storage

        let contents = zip.files["contents.json"];
        let json = JSON.parse(await contents.async("text"));

        if (encryption_on()) {
            for (let j = 0; j < json.length; j++) {
                json[j].id = await decrypt_text(json[j].id, json[j]["iv_string"] ?? "");
                json[j].author = await decrypt_text(json[j].author, json[j]["iv_string"] ?? "");
                json[j].direct_link = await decrypt_text(json[j].direct_link, json[j]["iv_string"] ?? "");
                json[j].title = await decrypt_text(json[j].title, json[j]["iv_string"] ?? "");
                json[j].media_url = await decrypt_text(json[j].media_url, json[j]["iv_string"] ?? "");
                json[j].subreddit = await decrypt_text(json[j].subreddit ?? "", json[j]["iv_string"] ?? "");
            }
        }

        for (let j = 0; j < json.length; j++) {
            json[j]["use_zip_file_nr"] = index; // cache in what zip file the image can be found
            control_json.push(json[j]); // append directly to permanent control array
        }
    });
}

async function select_post(number) {
    if (number >= 0 && number < control_json.length) {
        // ok region
    } else {
        number = 0;
    }

    $(".current_number").each((index, element) => {
        $(element).val(number);
    });

    await display_post(control_json[number]);

    // cache next posts asyncronously in the background
    retrieve_media_content(control_json[(number + 1) % control_json.length]);
    retrieve_media_content(control_json[(number + 2) % control_json.length]);
    retrieve_media_content(control_json[(number + 3) % control_json.length]);
}

async function display_post(json_post) {
    let browser_target = document.getElementById("view_target");

    let title = json_post.title;
    let author = json_post.author;
    let link = json_post.direct_link;
    let subreddit = json_post.subreddit ?? "";

    // retrieve blob
    let media_contents = await retrieve_media_content(json_post);

    const style = `style="width: ${$("#post_width").val()}%;"`;

    let content = "";
    // generate media element
    if (media_contents.type.includes("video")) {
        content = `<video ${style} autoplay muted controls loop><source src="${await blobToBase64(
            media_contents
        )}">Your browser does not support the video tag.</video>`;
    } else {
        // assume image mime type
        content = `<img src="${await blobToBase64(media_contents)}"  ${style}></img>`;
    }

    // set html output
    browser_target.innerHTML = `<h4>${subreddit}</h4><h2>${title}</h2>${content}<h4>${author}</h4><span>${link}</span><div style="position: absolute; top:3em; bottom:6em; left: 0; right: 60%;" class="view_prev"></div><div style="position: absolute; top:3em; bottom:6em; right: 0; left: 60%;" class="view_next"></div>`;
}

// returns a typed media blob
async function retrieve_media_content(json_post) {
    let zip_file_nr = 0;
    if (json_post["use_zip_file_nr"] != undefined) {
        zip_file_nr = json_post["use_zip_file_nr"];
    }

    const filename = json_post.hash_filename;
    const cache_index = zip_file_nr + filename;

    // if already cached, return immediately
    if (Object.keys(decrypted_media_cache).includes(cache_index)) {
        return decrypted_media_cache[cache_index][1];
    }

    // regenerate blob from zip
    let media_contents = await zip_file_array[zip_file_nr].files[filename].async("blob");
    media_contents = media_contents.slice(0, media_contents.size, json_post.mime_type); // write original mime type back into
    media_contents = await decrypt_blob(media_contents, json_post["iv_string"] ?? "");

    // element not in cache. Add before returning
    add_element_to_decrypted_media_cache(cache_index, media_contents);

    return media_contents;
}

function add_element_to_decrypted_media_cache(cache_index, media_blob) {
    // add element
    decrypted_media_cache[cache_index] = [0, media_blob]; // [age, media_blob]

    // age all entries
    for (const media_key in decrypted_media_cache) {
        decrypted_media_cache[media_key][0]++;
    }

    // delete too old entries
    Object.keys(decrypted_media_cache).forEach((media_key) => {
        if (decrypted_media_cache[media_key][0] > 8) {
            delete decrypted_media_cache[media_key];
        }
    });
}

function reset_display() {
    // set max number display
    $(".max_number").each((index, element) => {
        $(element).html(control_json.length - 1);
    });

    // get image files from zip and append to display
    select_post(0);
}

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function shuffle(array) {
    const newArray = [...array];
    const length = newArray.length;

    for (let start = 0; start < length; start++) {
        const randomPosition = Math.floor((newArray.length - start) * Math.random());
        const randomItem = newArray.splice(randomPosition, 1);

        newArray.push(...randomItem);
    }

    return newArray;
}

function reorder_control_array() {
    // sort by series index, as order might have been changed
    if (document.getElementById("randomize").checked) {
        // random order
        control_json = shuffle(control_json);
    } else {
        control_json = control_json.sort(function (a, b) {
            return a.series_index - b.series_index;
        });
    }
}
