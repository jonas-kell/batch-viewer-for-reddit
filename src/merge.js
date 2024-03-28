let zip_files = {};

$(document).ready(() => {
    document.getElementById("open_zip").addEventListener("click", async () => {
        let fileHandle;
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();

        const name = file.name;

        if (!Object.keys(zip_files).includes(name)) {
            JSZip.loadAsync(file).then(async function (zip) {
                zip_files[name] = zip;

                update_file_list();
            });
        } else {
            toastr.error("Zip file already included");
        }
    });

    document.getElementById("merge_action").addEventListener("click", async () => {
        generate_composite_collection();
    });

    update_file_list();
});

function update_file_list() {
    let name_list_string = "";

    Object.keys(zip_files).forEach((name) => {
        name_list_string += `<span>${name}</span><br />`;
    });

    document.getElementById("selected_zip_display").innerHTML = name_list_string;
}

async function generate_composite_collection() {
    $("#merge_action").attr("disabled", "disabled");

    let added_files = {};

    // merge and check for duplicates
    for (const zip_name in zip_files) {
        let zip = zip_files[zip_name];
        let contents = zip.files["contents.json"];
        let json = JSON.parse(await contents.async("text"));

        json.forEach((post) => {
            let hash_filename = post["hash_filename"];

            if (!Object.keys(added_files).includes(hash_filename)) {
                added_files[hash_filename] = {
                    content_entry: JSON.parse(JSON.stringify(post)),
                    series_index: post["series_index"],
                };
            }
        });
    }

    // sort
    let sorted_file_list = Object.keys(added_files)
        .sort(function (a, b) {
            return added_files[a].series_index - added_files[b].series_index;
        })
        .map(function (sortedKey) {
            return added_files[sortedKey];
        });

    // assemble
    var combined_zip = new JSZip();

    for (let zip_object_with_name of Object.entries(zip_files)) {
        let zip_object = zip_object_with_name[1];

        combined_zip = await combined_zip.loadAsync(await zip_object.generateAsync({ type: "blob" }), { createFolders: true });
    }

    // overwrite the "contents.json" with the correct, merged one
    let output_json = [];
    sorted_file_list.forEach((post) => {
        output_json.push(post["content_entry"]);
    });
    combined_zip.file("contents.json", JSON.stringify(output_json));

    // export and store
    combined_zip.generateAsync({ type: "blob" }).then(function (content) {
        // see FileSaver.js
        saveAs(content, "collected_archive_" + String(Date.now()) + ".zip");
    });

    $("#merge_action").attr("disabled", null);
}
