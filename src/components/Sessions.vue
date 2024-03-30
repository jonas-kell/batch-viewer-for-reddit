<script setup lang="ts">
    // $(document).ready(() => {
    //     document.getElementById("update_decryption_key").addEventListener("click", async () => {
    //         await set_key_to_use("decryption_key", "update_decryption_key");
    //         selectSession(); // clear page scope session

    //         update_session_display();
    //     });

    //     document.getElementById("create_session").addEventListener("click", async () => {
    //         await createSession();

    //         update_session_display();
    //     });

    //     document.getElementById("open_zip").addEventListener("click", async () => {
    //         let fileHandle;
    //         [fileHandle] = await window.showOpenFilePicker();
    //         const file = await fileHandle.getFile();
    //         const filename = file.name;

    //         if (filename.match(/[a-z]+_\d+(_encrypted)?.zip/g)) {
    //             await storeDataFileInSelectedSessionsOpfsFolder(file);
    //             toastr.info("Read in file: " + filename);
    //         } else {
    //             toastr.error("Data file not storable: " + filename);
    //         }

    //         update_session_display();
    //     });

    //     $("#zip_filepicker").on("change", async function (evt) {
    //         var files = evt.target.files;
    //         const nr_zip_files = files.length;

    //         // read in zip files
    //         for (var i = 0; i < nr_zip_files; i++) {
    //             const filename = files[i].name;

    //             if (filename.match(/[a-z]+_\d+(_encrypted)?.zip/g)) {
    //                 await storeDataFileInSelectedSessionsOpfsFolder(files[i]);
    //                 toastr.info("Read in file: " + filename);
    //             } else {
    //                 toastr.error("Data file not storable: " + filename);
    //             }
    //         }

    //         update_session_display();
    //     });

    //     update_session_display();
    // });

    // async function update_session_display() {
    //     let list = $("#session_list");
    //     let pickers = $("#file_pickers");
    //     let files_list = $("#loaded_files");

    //     // reset sessions array
    //     list.empty();
    //     files_list.empty();
    //     pickers.hide();

    //     // rebuild sessions array
    //     let sessionsMeta = await recreateSessionsMeta();
    //     let selectedSessionName = await getSelectedSessionName();

    //     // render
    //     for (const parsedSession of Object.values(sessionsMeta)) {
    //         // render element
    //         const style = parsedSession.name == selectedSessionName ? "background: green" : "";
    //         const content = `<tr>
    //                 <td style="${style}">${parsedSession.name}</td>
    //                 <td style="${style}">${parsedSession.is_encrypted ? "Yes" : "No"} ${
    //             parsedSession.is_encrypted && parsedSession.can_be_decrypted ? "Decr." : ""
    //         }</td>
    //                 <td style="${style}">${Object.keys(parsedSession.posts).length}</td>
    //                 <td style="${style}">${await getSessionNumberOfDataFileNames(parsedSession.name)}</td>
    //                 <td style="${style}">${sizeToString(await getSessionDataFileCompleteSize(parsedSession.name))}</td>
    //                 <td style="${style}">${
    //             parsedSession.can_be_decrypted
    //                 ? `<button class="select_session" file_name="${parsedSession.name}">Select</button>`
    //                 : ""
    //         }</td>
    //                 <td style="${style}"><button class="delete_session" file_name="${parsedSession.name}">Delete</button></td>
    //             </tr>`;

    //         // render file manager
    //         if (parsedSession.name == getSelectedSessionName()) {
    //             // show file pickers
    //             pickers.show();

    //             // update the content list
    //             for (const file_meta of Object.values(await getSessionDataFilesMeta(getSelectedSessionName()))) {
    //                 files_list.append("<li><b>" + file_meta.name + "</b> (" + sizeToString(file_meta.size) + ")</li>");
    //             }
    //         }

    //         // store results
    //         list.append(content);
    //     }

    //     update_event_listeners();
    // }

    // function update_event_listeners() {
    //     $(".delete_session").off("click");
    //     $(".delete_session").on("click", async function () {
    //         let fileNameToDelete = $(this).attr("file_name");

    //         let confirmed = confirm("Do you really want to delete Session " + fileNameToDelete + "? \n Press OK to continue");

    //         if (confirmed) {
    //             await deleteSession(fileNameToDelete);

    //             update_session_display();
    //         }
    //     });

    //     $(".select_session").off("click");
    //     $(".select_session").on("click", async function () {
    //         let fileNameToSelect = $(this).attr("file_name");

    //         // scope is automatically "page" scope
    //         if (selectSession(fileNameToSelect)) {
    //             update_session_display();
    //         }
    //     });
    // }
</script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    <h2>Create or load Session</h2>

    <br />
    <br />
    Session En-/Decryption key (If session is is is intended to be encrypted, this needs to be set):<br />
    <input type="password" id="decryption_key" value="" style="width: 40%" placeholder="Decryption Key" />
    <button id="update_decryption_key">Update</button>

    <br />
    <br />
    Locally stored Sessions:
    <button id="create_session" style="margin-left: 3em">Create</button>

    <br />
    <br />
    <div style="width: 100%; text-align: center">
        <div style="width: 90%; margin: auto">
            <table>
                <thead>
                    <tr>
                        <th>File</th>
                        <th>Encrypted</th>
                        <th>Number Posts</th>
                        <th>Number Files Loaded</th>
                        <th>Loaded Size</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="session_list"></tbody>
            </table>
        </div>
    </div>

    <br />
    <br />
    <hr />
    <div id="file_pickers" hidden>
        Add (basically unlimited large) single zip files (chrome only 'File System Access API'). <br />
        <button id="open_zip">Open Zip</button>
        <br />
        <br />
        Add multiple zip files, that can not be larger than around 50mb each (hopefully every browser and platform). <br />
        <input type="file" id="zip_filepicker" name="zip_filepicker" multiple />
        <br />
        <br />
        Files stored in the session:
        <ul id="loaded_files"></ul>
    </div>
</template>

<style scoped></style>
