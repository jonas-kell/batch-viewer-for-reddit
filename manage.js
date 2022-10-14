$(document).ready(() => {
    document.getElementById("update_decryption_key").addEventListener("click", () => {
        set_key_to_use("decryption_key", "update_decryption_key");
    });

    document.getElementById("open_zip").addEventListener("click", async () => {
        let fileHandle;
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();

        JSZip.loadAsync(file).then(async function (zip) {
            let contents = zip.files["contents.json"];

            let json = JSON.parse(await contents.async("text"));

            if (encryption_on()) {
                for (let i = 0; i < json.length; i++) {
                    json[i].id = await decrypt_text(json[i].id);
                    json[i].direct_link = await decrypt_text(json[i].direct_link);
                    json[i].title = await decrypt_text(json[i].title);
                    json[i].image_link = await decrypt_text(json[i].image_link);
                }
            }

            // get image files from zip and append to display
            display_post(json[0], zip);
        });
    });
});

async function display_post(json_post, zip) {
    let browser_target = document.getElementById("view_target");

    let title = json_post.title;
    let link = json_post.direct_link;
    let image_contents = await zip.files[json_post.hash_filename].async("blob");

    image_contents = await decrypt_blob(image_contents);

    browser_target.innerHTML = `<h2>${title}</h2> <img src="${await blobToBase64(
        image_contents
    )}" style="width: 60%;"><br /><span>${link}</span>`;
}

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}
