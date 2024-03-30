<script setup lang="ts">
    import PasswordField from "./PasswordField.vue";
    import SessionInfo from "./SessionInfo.vue";
    import toastr from "toastr";
    import useSessionsMetaStore from "./../stores/sessionsMeta";
    import { computed, onMounted, ref } from "vue";
    import { getSessionDataFileCompleteSize, getSessionNumberOfDataFileNames, sizeToString } from "../functions/opfs";
    import { fileSystemAccessApiPicker } from "./../functions/interactBrowser";
    import { MemorySession } from "../functions/interfaces";
    const sessionsMetaStore = useSessionsMetaStore();

    const scope = "page";
    onMounted(() => {
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scope);
    });

    const sessions = computed(() => {
        return sessionsMetaStore.getSessions(scope);
    });

    async function createSession() {
        await sessionsMetaStore.createSession(scope);

        toastr.success(`Created Session`);
    }

    async function deleteSession(session: MemorySession) {
        let confirmed = confirm("Do you really want to delete Session " + session.name + "? \n Press OK to continue");

        if (confirmed) {
            sessionsMetaStore.deleteSession(session, scope);
            selectedSession.value = null;
            toastr.success(`Deleted Session ${session.name}`);
        }
    }

    const selectedSession = ref(null as MemorySession | null);
    function selectSession(session: MemorySession) {
        selectedSession.value = session;
    }

    async function zipFilePickerHandler() {
        if (selectedSession.value != null) {
            const [file, filename] = await fileSystemAccessApiPicker();

            if (filename.match(/[a-z]+_\d+(_encrypted)?.zip/g)) {
                await sessionsMetaStore.addFileToSession(selectedSession.value, file, scope);
                toastr.info("Read in file: " + filename);
            } else {
                toastr.error("Data file not storable: " + filename);
            }

            sessionsMetaStore.reParseLocalSessionCacheFromFiles(scope);
        }
    }

    async function filePickerChangeHandler(evt: { target: { files: File[] } }) {
        if (selectedSession.value != null) {
            const files = evt.target.files;
            const nr_zip_files = files.length;

            // read in zip files
            for (var i = 0; i < nr_zip_files; i++) {
                const filename = files[i].name;

                if (filename.match(/[a-z]+_\d+(_encrypted)?.zip/g)) {
                    await sessionsMetaStore.addFileToSession(selectedSession.value, files[i], scope);

                    toastr.info("Read in file: " + filename);
                } else {
                    toastr.error("Data file not storable: " + filename);
                }
            }
        }
    }
</script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    <h2>Create or load Session</h2>

    <br />
    <br />
    <PasswordField
        scope="page"
        hint="Insert Encryption Key"
        hintActivated="Encryption Activated"
        description="Session En-/Decryption key (If session is is is intended to be encrypted, this needs to be set):"
    ></PasswordField>

    <br />
    <br />
    Locally stored Sessions:
    <button style="margin-left: 3em" @click="createSession">Create</button>

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
                <tbody>
                    <tr
                        v-for="session in sessions"
                        :class="{
                            selected: selectedSession && selectedSession.name == session.name,
                        }"
                    >
                        <td>{{ session.name }}</td>
                        <td>
                            {{ session.is_encrypted ? "Yes" : "No" }}
                            {{ session.is_encrypted && session.can_be_decrypted ? "Decr." : "" }}
                        </td>
                        <td>{{ Object.keys(session.posts).length }}</td>
                        <td>{{ getSessionNumberOfDataFileNames(session) }}</td>
                        <td>{{ sizeToString(getSessionDataFileCompleteSize(session)) }}</td>
                        <td>
                            <button class="select_session" v-if="session.can_be_decrypted" @click="selectSession(session)">
                                Select
                            </button>
                        </td>
                        <td><button class="delete_session" @click="deleteSession(session)">Delete</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <br />
    <br />
    <hr />
    <div id="file_pickers" :hidden="selectedSession == null">
        Add (basically unlimited large) single zip files (chrome only 'File System Access API'). <br />
        <button @click="zipFilePickerHandler">Open Zip</button>
        <br />
        <br />
        Add multiple zip files, that can not be larger than around 50mb each (hopefully every browser and platform). <br />
        <input type="file" multiple @change="(evt:any) => filePickerChangeHandler(evt)" />
        <br />
        <br />
        <SessionInfo :session="selectedSession"></SessionInfo>
    </div>
</template>

<style scoped>
    tr.selected td {
        background-color: green;
    }
</style>
