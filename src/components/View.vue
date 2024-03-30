<script setup lang="ts">
    import { onMounted, ref, watch } from "vue";
    import PasswordField from "./PasswordField.vue";
    import useSessionsMetaStore from "./../stores/sessionsMeta";
    import SessionSelectButtons from "./SessionSelectButtons.vue";
    import { MemorySession, Post } from "../functions/interfaces";
    import { loadBlobFromStorage } from "../functions/zipFilesManagement";
    import { blobToBase64 } from "../functions/hash";
    const sessionsMetaStore = useSessionsMetaStore();

    const scope = "page";
    onMounted(() => {
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scope);

        // triggers for the dynamically generated parts of the html
        document.addEventListener("click", function (event: any) {
            // Check if the clicked element has the class "view_prev"
            if (event.target.classList.contains("view_prev")) {
                console.log("view_prev clicked");
                selectPrevImage();
            }
        });
        document.addEventListener("click", function (event: any) {
            // Check if the clicked element has the class "view_prev"
            if (event.target.classList.contains("view_next")) {
                console.log("view_next clicked");
                selectNextImage();
            }
        });
    });

    const selectedSession = ref(null as MemorySession | null);
    function handleSessionSelected(session: MemorySession | null) {
        selectedSession.value = session;
    }

    function reRandomize() {
        // TODO randomize
        console.log("randomize");
    }

    const imageWidth = ref(parseInt(localStorage.getItem("image-width") ?? "100"));
    const currentPostNumber = ref(0);
    const maxPostNumber = ref(0);

    watch(imageWidth, () => {
        localStorage.setItem("image-width", String(imageWidth.value));
    });

    function selectPrevImage() {
        selectPost(currentPostNumber.value - 1);
    }
    function selectNextImage() {
        selectPost(currentPostNumber.value + 1);
    }

    let renderedMediaCache: { [key: string]: [number, HTMLElement] } = {};

    watch(imageWidth, () => {
        clearRenderedMediaCache();
        selectPost(currentPostNumber.value);
    });
    watch(
        selectedSession,
        () => {
            clearRenderedMediaCache();
            // reset display
            resetDisplay();
        },
        {
            deep: true,
        }
    );

    async function selectPost(number: number) {
        if (number >= 0 && number < getNumberOfPosts()) {
            // ok region
        } else {
            number = 0;
        }
        currentPostNumber.value = number;

        const json = getPostJson(number);
        if (json) {
            await displayPost(json);
        } else {
            console.error("No post json found");
        }

        // cache next posts asynchronously in the background
        const timeDifference = 400;
        const numberOfPostsToCache = 3;
        function cacheInBackground(postNr: number, offset: number) {
            setTimeout(() => {
                renderPost(getPostJson((postNr + offset) % getNumberOfPosts()));
            }, timeDifference * offset);
        }
        for (let i = 1; i <= numberOfPostsToCache; i++) {
            cacheInBackground(number, i);
        }
    }

    async function displayPost(jsonPost: Post) {
        const browserTarget = document.getElementById("view_target");
        const cacheRegion = document.getElementById("view_area_cache");
        const renderedElement = await renderPost(jsonPost);

        if (browserTarget && cacheRegion && renderedElement) {
            // move no longer needed elements out
            [...browserTarget.children].forEach((child) => {
                cacheRegion.appendChild(child);
            });

            // move new element in
            browserTarget.appendChild(renderedElement);
        }
    }

    // caches the result
    async function renderPost(jsonPost: Post | null): Promise<HTMLElement> {
        if (jsonPost == null) {
            return document.createElement("div");
        }

        const filename = jsonPost.hash_filename;
        const cacheIndex = (jsonPost.zip_file_name ?? "") + filename;

        // if already cached, return immediately
        if (Object.keys(renderedMediaCache).includes(cacheIndex)) {
            return renderedMediaCache[cacheIndex][1];
        }

        // not cached, so create new
        let title = jsonPost.title ?? "";
        let author = jsonPost.author ?? "";
        let link = jsonPost.direct_link ?? "";
        let subreddit = jsonPost.subreddit ?? "";

        // retrieve blob
        let mediaContents = await retrieveMediaContent(jsonPost);

        const style = `style="width: ${imageWidth.value}%;"`;

        let content = "";
        // generate media element
        if (mediaContents) {
            if (mediaContents.type.includes("video")) {
                content = `<video ${style} autoplay muted controls loop><source src="${await blobToBase64(
                    mediaContents
                )}">Your browser does not support the video tag.</video>`;
            } else {
                // assume image mime type
                content = `<img src="${await blobToBase64(mediaContents)}"  ${style}></img>`;
            }
        }

        // set html output
        const cacheElement = document.createElement("div");
        cacheElement.innerHTML = `<h4>${subreddit}</h4><h2>${title}</h2>${content}<h4>${author}</h4><span>${link}</span><div style="position: absolute; top:3em; bottom:6em; left: 0; right: 60%;" class="view_prev"></div><div style="position: absolute; top:3em; bottom:6em; right: 0; left: 60%;" class="view_next"></div>`;

        // append to dom
        let cacheRegion = document.getElementById("view_area_cache");
        if (cacheRegion) {
            cacheRegion.appendChild(cacheElement);
        }

        // element not in cache. Add before returning
        addElementToMediaCache(cacheIndex, cacheElement);

        return cacheElement;
    }

    function addElementToMediaCache(cacheIndex: string, cacheElement: HTMLElement) {
        // add element
        renderedMediaCache[cacheIndex] = [0, cacheElement]; // [age, cache_element]

        // age all entries
        for (const media_key in renderedMediaCache) {
            renderedMediaCache[media_key][0]++;
        }

        // delete too old entries
        Object.keys(renderedMediaCache).forEach((media_key) => {
            if (renderedMediaCache[media_key][0] > 8) {
                renderedMediaCache[media_key][1].remove(); // remove from dom
                delete renderedMediaCache[media_key]; // remove js
            }
        });
    }

    function clearRenderedMediaCache() {
        let cacheRegion = document.getElementById("view_area_cache");
        let browserTarget = document.getElementById("view_target");

        // delete dom nodes
        if (cacheRegion) {
            var child = cacheRegion.lastElementChild;
            while (child) {
                cacheRegion.removeChild(child);
                child = cacheRegion.lastElementChild;
            }
        }
        if (browserTarget) {
            child = browserTarget.lastElementChild;
            while (child) {
                browserTarget.removeChild(child);
                child = browserTarget.lastElementChild;
            }
        }

        // clear js cache
        renderedMediaCache = {};
    }

    // returns a typed media blob
    async function retrieveMediaContent(jsonPost: Post): Promise<Blob | null> {
        let res = null as Blob | null;
        // load zip from file system
        if (selectedSession.value) {
            res = await loadBlobFromStorage(selectedSession.value, jsonPost, scope);
        }

        return res;
    }

    function resetDisplay() {
        // set max number display
        maxPostNumber.value = getNumberOfPosts() - 1;

        // get image files from zip and append to display
        selectPost(0);
    }

    function getPostJson(index: number) {
        if (selectedSession.value == null) {
            return null;
        } else {
            return selectedSession.value.posts[Object.keys(selectedSession.value.posts)[index]];
        }
    }

    function getNumberOfPosts() {
        if (selectedSession.value == null) {
            return 0;
        } else {
            return Object.keys(selectedSession.value.posts).length;
        }
    }
</script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    <h2>Display Contents</h2>
    <br />
    <PasswordField
        scope="page"
        hint="Insert Decryption Key"
        hintActivated="Decryption Key set for use"
        description="Decryption key (If input is encrypted, this needs to be set):"
    ></PasswordField>

    <br />
    <br />
    Which Session to view:
    <SessionSelectButtons
        defaultSelectionLabel="Please Select Session"
        scope="page"
        @sessionSelected="handleSessionSelected"
    ></SessionSelectButtons>
    <br />
    <br />
    Randomize Images:
    <button @click="reRandomize">SHUFFLE</button>
    &nbsp&nbsp Image Width:
    <input type="number" min="10" max="100" step="10" v-model="imageWidth" />

    <br />
    <br />
    <div style="width: 100%; text-align: center">
        <div style="width: 60%; margin: auto">
            <input type="number" min="0" :max="maxPostNumber" step="1" style="width: 20%" v-model="currentPostNumber" /> /
            <span>{{ maxPostNumber }}</span>
            <span style="float: left; border: 1px solid black; cursor: pointer" @click="selectPrevImage">prev</span>
            <span style="float: right; border: 1px solid black; cursor: pointer" @click="selectNextImage">next</span>
        </div>
    </div>
    <br />
    <div style="width: 100%; text-align: center; min-height: 2cm; border: 2px solid black; position: relative">
        <div style="width: 98%; text-align: center; position: relative; margin: auto" id="view_target"></div>
        <div style="visibility: hidden" hidden id="view_area_cache"></div>
    </div>
    <br />
    <div style="width: 100%; text-align: center">
        <div style="width: 60%; margin: auto">
            <input type="number" style="width: 20%" disabled v-model="currentPostNumber" /> /
            <span>{{ maxPostNumber }}</span>
            <span style="float: left; border: 1px solid black; cursor: pointer" @click="selectPrevImage">prev</span>
            <span style="float: right; border: 1px solid black; cursor: pointer" @click="selectNextImage">next</span>
        </div>
    </div>
</template>

<style scoped></style>
