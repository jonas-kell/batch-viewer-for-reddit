<script setup lang="ts"></script>

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
