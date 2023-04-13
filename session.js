$(document).ready(() => {
    document.getElementById("update_decryption_key").addEventListener("click", async () => {
        await set_key_to_use("decryption_key", "update_decryption_key");

        update_session_display();
    });

    document.getElementById("create_session").addEventListener("click", async () => {
        let filename = "Session_" + String(Date.now()) + ".json";
        const sessionDirHandle = await getSessionDirectoryHandle();
        const sessionFileHandle = await sessionDirHandle.getFileHandle(filename, {
            create: true,
        });
        const writable = await sessionFileHandle.createWritable();
        const iv_string = uint8array_to_iv_string(crypto.getRandomValues(new Uint8Array(12)));
        await writable.write(
            `{"name": "${filename}", "encrypted": ${encryption_on()}, "encryption_test": "${await encrypt_text(
                String(Math.random()),
                iv_string
            )}", "iv_string": "${iv_string}", "content": []}`
        );
        await writable.close();

        update_session_display();
    });

    update_session_display();
});

async function update_session_display() {
    let list = $("#session_list");
    list.empty();

    const sessionDirHandle = await getSessionDirectoryHandle();

    for await (const entry of sessionDirHandle.values()) {
        if ((entry.kind = "file" && entry.name.match(/Session_\d*.json/g))) {
            const file = await entry.getFile();
            let parsedSession = JSON.parse(await file.text());
            console.log(parsedSession);
            const is_encrypted = parsedSession.encrypted;
            const iv_string = parsedSession.iv_string;
            const can_be_decrypted =
                !is_encrypted ||
                (is_encrypted &&
                    encryption_on() &&
                    (await decrypt_text(parsedSession.encryption_test, iv_string)) != "Decryption Error");

            let content = `<tr>
                <td>${parsedSession.name}</td>
                <td>${is_encrypted ? "Yes" : "No"}</td>
                <td>${can_be_decrypted ? "dec" : "no dec"}</td>
                <td></td>
                <td></td>
                <td></td>
                <td><button class="delete_session" file_name="${entry.name}">Delete</button></td>
            </tr>`;

            list.append(content);
        }
    }

    update_event_listeners();
}

function update_event_listeners() {
    $(".delete_session").off("click");
    $(".delete_session").on("click", async function (button_element) {
        const sessionDirHandle = await getSessionDirectoryHandle();

        let fileNameToDelete = $(this).attr("file_name");

        let confirmed = confirm("Do you really want to delete Session " + fileNameToDelete + "? \n Press OK to continue");

        if (confirmed) {
            await sessionDirHandle.removeEntry(fileNameToDelete);
            console.log(`Deleted Session ${fileNameToDelete}`);

            update_session_display();
        }
    });
}

async function getSessionDirectoryHandle() {
    const originPrivateFileSystem = await navigator.storage.getDirectory();
    const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle("session-storage", { create: true });

    return sessionDirHandle;
}
