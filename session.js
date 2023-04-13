let sessionsMeta = {};
let selected_session_name = "";

$(document).ready(() => {
    document.getElementById("update_decryption_key").addEventListener("click", async () => {
        await set_key_to_use("decryption_key", "update_decryption_key");
        selected_session_name = "";

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
            )}", "iv_string": "${iv_string}", "posts": []}`
        );
        await writable.close();

        update_session_display();
    });

    update_session_display();
});

async function update_session_display() {
    const sessionDirHandle = await getSessionDirectoryHandle();
    let list = $("#session_list");
    let properties = $("#session_properties");

    // reset sessions array
    list.empty();
    sessionsMeta = {};
    properties.hide();

    // rebuild sessions array
    for await (const entry of sessionDirHandle.values()) {
        if ((entry.kind = "file" && entry.name.match(/Session_\d*.json/g))) {
            const file = await entry.getFile();

            // parse info
            let parsedSession = JSON.parse(await file.text());
            const is_encrypted = parsedSession.encrypted;
            const iv_string = parsedSession.iv_string;
            const can_be_decrypted =
                !is_encrypted ||
                (is_encrypted &&
                    encryption_on() &&
                    (await decrypt_text(parsedSession.encryption_test, iv_string)) != "Decryption Error");

            // render element
            const style = parsedSession.name == selected_session_name ? "background: green" : "";
            const content = `<tr>
                <td style="${style}">${parsedSession.name}</td>
                <td style="${style}">${is_encrypted ? "Yes" : "No"} ${is_encrypted && can_be_decrypted ? "Decr." : ""}</td>
                <td style="${style}">${parsedSession.posts.length}</td>
                <td style="${style}"></td>
                <td style="${style}"></td>
                <td style="${style}">${
                can_be_decrypted ? `<button class="select_session" file_name="${entry.name}">Select</button>` : ""
            }</td>
                <td style="${style}"><button class="delete_session" file_name="${entry.name}">Delete</button></td>
            </tr>`;

            // render file manager
            if (parsedSession.name == selected_session_name) {
                properties.show();
            }

            // store results
            sessionsMeta[parsedSession.name] = {
                is_encrypted: is_encrypted,
                iv_string: iv_string,
                can_be_decrypted: can_be_decrypted,
                session: parsedSession,
            };
            list.append(content);
        }
    }

    update_event_listeners();
}

function update_event_listeners() {
    $(".delete_session").off("click");
    $(".delete_session").on("click", async function () {
        const sessionDirHandle = await getSessionDirectoryHandle();

        let fileNameToDelete = $(this).attr("file_name");

        let confirmed = confirm("Do you really want to delete Session " + fileNameToDelete + "? \n Press OK to continue");

        if (confirmed) {
            await sessionDirHandle.removeEntry(fileNameToDelete);
            console.log(`Deleted Session ${fileNameToDelete}`);

            update_session_display();
        }
    });

    $(".select_session").off("click");
    $(".select_session").on("click", async function () {
        let fileNameToSelect = $(this).attr("file_name");

        if (Object.keys(sessionsMeta).includes(fileNameToSelect)) {
            if (sessionsMeta[fileNameToSelect].can_be_decrypted ?? false) {
                selected_session_name = fileNameToSelect;
                update_session_display();
            } else {
                console.error("Encrypted session can not be selected without key");
            }
        } else {
            console.error("Key not found in sessionsMeta cache");
        }
    });
}

async function getSessionDirectoryHandle() {
    const originPrivateFileSystem = await navigator.storage.getDirectory();
    const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle("session-storage", { create: true });

    return sessionDirHandle;
}
