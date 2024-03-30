<script setup lang="ts">
    import PasswordField from "./PasswordField.vue";
    import SessionSelectButtons from "./SessionSelectButtons.vue";
    import useSessionsMetaStore from "./../stores/sessionsMeta";
    import { computed, onMounted, ref, watch } from "vue";
    import { MemorySession } from "../functions/interfaces";
    import { copyToClipboard, downloadBlob } from "../functions/interactBrowser";
    import toastr from "toastr";
    import { DownloadSessionState, generateRedditApiURL, processPosts } from "../functions/archiveMedia";
    import useProgressStore from "./../stores/progress";
    import { generateZipFileName } from "../functions/zipFilesManagement";

    const sessionsMetaStore = useSessionsMetaStore();
    const progressStore = useProgressStore();

    const scope = "page";
    onMounted(() => {
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scope);
        updateProxyReachability();
    });

    const selectedSession = ref(null as MemorySession | null);
    function handleSessionSelected(session: MemorySession | null) {
        selectedSession.value = session;
    }

    const downloadSessionState = ref({
        count: 0,
        archived_count: 0,
        start_with_post: "",
        subreddit_name: "mathmemes",
    } as DownloadSessionState);

    const proxyHostAddress = ref(localStorage.getItem("proxy_url") ?? "");

    function generateURL() {
        urlOutputApi.value = generateRedditApiURL(downloadSessionState.value, false);
        urlOutput.value = generateRedditApiURL(downloadSessionState.value, true);
    }

    const urlOutput = ref("");
    const urlOutputApi = ref("");

    const downloadRunning = ref(false);

    async function processPostsAction() {
        downloadRunning.value = true;
        try {
            generateURL();

            const startWithPost = downloadSessionState.value.start_with_post;

            // funny, this changed recently and broke the app
            if (startWithPost == "" || startWithPost.length == 6 || startWithPost.length == 7) {
                toastr.info(
                    `URL for scraping subreddit "${downloadSessionState.value.subreddit_name}" for next set of posts` +
                        (startWithPost ? ` after the post with the id ${startWithPost}` : "")
                );

                const content = await processPosts(
                    selectedSession.value,
                    downloadSessionState.value,
                    proxyHostAddress.value,
                    scope
                );
                const filename = generateZipFileName(scope);

                if (selectedSession.value == null) {
                    downloadBlob(content, filename);
                    toastr.info("Zip downloaded");
                } else {
                    (content as any).name = filename;
                    const file = content as File;
                    const sessionName = selectedSession.value.name; // gets unselected here ...
                    await sessionsMetaStore.addFileToSession(selectedSession.value, file, scope);
                    await sessionsMetaStore.reParseLocalSessionCacheFromFiles(scope);

                    toastr.info("Stored " + filename + " successfully into the session data files of session: " + sessionName);
                }
            } else {
                toastr.error("Post to start with not set correctly");
            }
            generateURL(); // advance url after download
        } catch (error) {
            console.error(error);
            downloadRunning.value = false;
        }
        downloadRunning.value = false;
    }

    const proxyUrl = computed(() => {
        return `https://${proxyHostAddress.value}:9376/`;
    });
    const proxyCheckEndpointUrl = computed(() => {
        return `${proxyUrl.value}check`;
    });
    const proxyCheckTorEndpointUrl = computed(() => {
        return `${proxyUrl.value}check_tor`;
    });

    const proxyReachable = ref(false);
    const proxyUsesTor = ref(false);

    async function updateProxyReachability() {
        await fetch(proxyCheckEndpointUrl.value, {
            method: "GET",
        })
            .then(async (response) => {
                proxyReachable.value = false;
                if (response.ok) {
                    const jsonData = await response.json();

                    if (jsonData.success != undefined && jsonData.success) {
                        toastr.success("Connected to Proxy Server");
                        proxyReachable.value = true;
                        return;
                    }
                }
                toastr.error("Proxy Server not found");
            })
            .catch(() => {
                proxyReachable.value = false;
                toastr.error("Proxy Server not found");
            });
        if (proxyReachable.value) {
            await fetch(proxyCheckTorEndpointUrl.value, {
                method: "GET",
            })
                .then(async (response) => {
                    proxyUsesTor.value = false;
                    if (response.ok) {
                        const jsonData = await response.json();

                        if (jsonData.tor_connection != undefined && jsonData.tor_connection) {
                            proxyUsesTor.value = true;
                            return;
                        }
                    }
                })
                .catch(() => {
                    proxyUsesTor.value = false;
                });
        } else {
            proxyUsesTor.value = false;
        }
    }

    watch(
        proxyHostAddress,
        async () => {
            localStorage.setItem("proxy_url", proxyHostAddress.value);
        },
        {
            immediate: true,
        }
    );

    const proxyFieldBackground = computed(() => {
        if (proxyHostAddress.value == "") {
            return "";
        }

        if (proxyReachable.value) {
            if (proxyUsesTor.value) {
                return "purple";
            } else {
                return "green";
            }
        } else {
            return "red";
        }
    });
</script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    This uses the public part of the reddit api to get the information about posts. Be responsible and slow with your requests or
    you might get rate limited or blocked.

    <h2>Archive page</h2>
    <div>
        Proxy Server (See `README.md`, Needed because of CORS):
        <br />
        https://<input
            type="text"
            v-model="proxyHostAddress"
            :style="{
                'background-color': proxyFieldBackground,
            }"
            @blur="updateProxyReachability"
        />:9376/
        <br />
        <br />
        Subreddit to scrape<br />
        <input type="text" placeholder="mathmemes" v-model="downloadSessionState.subreddit_name" /><br />
        Post to start with (short-link shown by "old.reddit.com" format, e.g. "y3215w" in the case of https://redd.it/y3215w)<br />
        <input type="text" v-model="downloadSessionState.start_with_post" />
        <button @click="generateURL">Generate URL</button>

        <br />
        <br />
        URL of the posts (old.reddit) because easier to see<br />
        <input type="text" disabled style="width: 60%" v-model="urlOutput" />
        <button @click="copyToClipboard(urlOutput)">Copy to clipboard</button>
        <br />
        URL of the corresponding api endpoint<br />
        <input type="text" disabled style="width: 60%" v-model="urlOutputApi" />

        <button
            :style="{
                background: downloadRunning ? '' : 'green',
            }"
            :disabled="downloadRunning"
            @click="processPostsAction"
        >
            Process one set of Posts
        </button>

        <div v-if="downloadRunning">
            <br />
            <br />
            <b>Progress: </b> <span>Target: {{ progressStore.filesToDownload }}</span>
            <span style="color: green; margin-left: 2em">Success: {{ progressStore.fileSuccess }}</span>
            <span style="color: red; margin-left: 2em">Error: {{ progressStore.fileError }}</span>
            <span style="color: darkgoldenrod; margin-left: 2em">
                Pending: {{ progressStore.filesToDownload - progressStore.fileSuccess - progressStore.fileError }}
            </span>
        </div>

        <br />
        <br />
        <PasswordField
            scope="page"
            hint="Insert Encryption Key"
            hintActivated="Encryption Activated"
            description="Encryption key (If set, the output will be encrypted):"
        ></PasswordField>

        <br />
        <br />
        Where to put the results:
        <SessionSelectButtons
            defaultSelectionLabel="Download"
            scope="page"
            @sessionSelected="handleSessionSelected"
        ></SessionSelectButtons>
    </div>
</template>

<style scoped></style>
