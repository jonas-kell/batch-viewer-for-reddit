$(document).ready(() => {
    document.getElementById("update_decryption_key").addEventListener("click", async () => {
        await set_key_to_use("decryption_key", "update_decryption_key");
        selectSession();

        update_session_display();
    });

    document.getElementById("create_session").addEventListener("click", async () => {
        await createSession();

        update_session_display();
    });

    document.getElementById("open_zip").addEventListener("click", async () => {
        let fileHandle;
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const filename = file.name;

        if (filename.match(/[a-z]+_\d+(_encrypted)?.zip/g)) {
            await storeDataFileInSelectedSessionsOpfsFolder(file);
            toastr.info("Read in file: " + filename);
        } else {
            toastr.error("Data file not storable: " + filename);
        }

        update_session_display();
    });

    $("#zip_filepicker").on("change", async function (evt) {
        var files = evt.target.files;
        const nr_zip_files = files.length;

        // read in zip files
        for (var i = 0; i < nr_zip_files; i++) {
            const filename = files[i].name;

            if (filename.match(/[a-z]+_\d+(_encrypted)?.zip/g)) {
                await storeDataFileInSelectedSessionsOpfsFolder(files[i]);
                toastr.info("Read in file: " + filename);
            } else {
                toastr.error("Data file not storable: " + filename);
            }
        }

        update_session_display();
    });

    update_session_display();
});

async function update_session_display() {
    let list = $("#session_list");
    let pickers = $("#file_pickers");
    let files_list = $("#loaded_files");

    // reset sessions array
    list.empty();
    files_list.empty();
    pickers.hide();

    // rebuild sessions array
    let sessionsMeta = await recreateSessionsMeta();

    // render
    for (const parsedSession of Object.values(sessionsMeta)) {
        // render element
        const style = parsedSession.name == selected_session_name ? "background: green" : "";
        const content = `<tr>
                <td style="${style}">${parsedSession.name}</td>
                <td style="${style}">${parsedSession.is_encrypted ? "Yes" : "No"} ${
            parsedSession.is_encrypted && parsedSession.can_be_decrypted ? "Decr." : ""
        }</td>
                <td style="${style}">${Object.keys(parsedSession.posts).length}</td>
                <td style="${style}">${await getSessionNumberOfDataFileNames(parsedSession.name)}</td>
                <td style="${style}">${sizeToString(await getSessionDataFileCompleteSize(parsedSession.name))}</td>
                <td style="${style}">${
            parsedSession.can_be_decrypted
                ? `<button class="select_session" file_name="${parsedSession.name}">Select</button>`
                : ""
        }</td>
                <td style="${style}"><button class="delete_session" file_name="${parsedSession.name}">Delete</button></td>
            </tr>`;

        // render file manager
        if (parsedSession.name == getSelectedSessionName()) {
            // show file pickers
            pickers.show();

            // update the content list
            for (const name of await getCurrentSessionDataFilesNames()) {
                files_list.append("<li>" + name + "</li>");
            }
        }

        // store results
        list.append(content);
    }

    update_event_listeners();
}

function update_event_listeners() {
    $(".delete_session").off("click");
    $(".delete_session").on("click", async function () {
        let fileNameToDelete = $(this).attr("file_name");

        let confirmed = confirm("Do you really want to delete Session " + fileNameToDelete + "? \n Press OK to continue");

        if (confirmed) {
            await deleteSession(fileNameToDelete);

            update_session_display();
        }
    });

    $(".select_session").off("click");
    $(".select_session").on("click", async function () {
        let fileNameToSelect = $(this).attr("file_name");

        if (selectSession(fileNameToSelect)) {
            update_session_display();
        }
    });
}
