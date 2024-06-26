<script setup lang="ts">
    import { computed, onMounted, ref, toRaw, watch } from "vue";
    import PasswordField from "./PasswordField.vue";
    import useSessionsMetaStore from "./../stores/sessionsMeta";
    import SessionSelectButtons from "./SessionSelectButtons.vue";
    import { MemorySession, Post, getRating } from "../functions/interfaces";
    import { loadBlobFromStorage } from "../functions/zipFilesManagement";
    import { blobToBase64 } from "../functions/hash";
    import seedrandom from "seed-random";
    import { v4 as uuid } from "uuid";
    import RatingVue from "./Rating.vue";
    import FilterVue from "./Filter.vue";
    import { filteredPosts, Filter, getLastUsedFilter } from "../functions/filter";

    const sessionsMetaStore = useSessionsMetaStore();

    const viewerUUID = ref(uuid());

    function postNumberCacheKey(session: MemorySession) {
        return "currentlySelectedPostForSession_" + session.name;
    }

    const scope = "page";
    onMounted(() => {
        reParseFromStorageToMemory();

        sessionStorage.setItem("listenerViewUUID", viewerUUID.value); // yes, vou COULD unregister them. I hate dealing with un-registering

        // triggers for the dynamically generated parts of the html
        document.addEventListener("click", function (event: any) {
            // Check if the clicked element has the class "view_prev"
            if (event.target.classList.contains("view_prev")) {
                // avoid multiple registered listeners
                if (sessionStorage.getItem("listenerViewUUID") == viewerUUID.value) {
                    console.log("view_prev clicked");
                    selectPrevImage();
                }
            }
        });
        document.addEventListener("click", function (event: any) {
            // Check if the clicked element has the class "view_prev"
            if (event.target.classList.contains("view_next")) {
                // avoid multiple registered listeners
                if (sessionStorage.getItem("listenerViewUUID") == viewerUUID.value) {
                    console.log("view_next clicked");
                    selectNextImage();
                }
            }
        });
    });

    function reParseFromStorageToMemory() {
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scope);

        // dirty write cache now should be cleared
        ratingOverwrites.value = {};
    }

    const selectedSession = ref(null as MemorySession | null);
    function handleSessionSelected(session: MemorySession | null) {
        selectedSession.value = session;
    }

    const randomnessSeed = ref((localStorage.getItem("randomnessSeedForDisplay") ?? String(Math.random())) as string);

    function reRandomize() {
        let confirmed = confirm("Do you really want to Re-Randomize?");

        if (confirmed) {
            randomnessSeed.value = String(Math.random());
            localStorage.setItem("randomnessSeedForDisplay", randomnessSeed.value);

            resetDisplay();
            selectPost(0);
        }
    }

    const randomnessMapping = computed((): string[] => {
        const rng = seedrandom(randomnessSeed.value);

        if (selectedSession.value) {
            let keyArray = Object.keys(currentPosts.value);

            const numSwaps = keyArray.length * 3; // TODO other number???
            for (let index = 0; index < numSwaps; index++) {
                const firstIndex = Math.round(rng() * (keyArray.length - 1));
                const secondIndex = Math.round(rng() * (keyArray.length - 1));

                // swap two keys
                const tmp = keyArray[firstIndex];
                keyArray[firstIndex] = keyArray[secondIndex];
                keyArray[secondIndex] = tmp;
            }

            return keyArray;
        } else {
            return [];
        }
    });

    const imageWidth = ref(parseInt(localStorage.getItem("image-width") ?? "100"));
    const currentPostNumber = ref(0);
    const maxPostNumber = computed(() => {
        return numberOfPosts.value - 1;
    });

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

            if (postsRatingDirty.value) {
                postsRatingDirty.value = false;
                reParseFromStorageToMemory();
            }
        },
        {
            deep: false, // this cleared the cache too often, if not intended
        }
    );

    const selectedPost = ref(null as null | Post);

    async function selectPost(number: number) {
        if (number >= 0 && number < numberOfPosts.value) {
            // ok region
        } else {
            number = 0;
        }
        currentPostNumber.value = number;

        // cache viewed post number
        if (selectedSession.value) {
            localStorage.setItem(postNumberCacheKey(selectedSession.value), String(currentPostNumber.value));
        }

        const json = getPostJson(number);
        if (json) {
            await displayPost(json);
            selectedPost.value = json;
        } else {
            console.error("No post json found");
            selectedPost.value = null;
        }

        // cache next posts asynchronously in the background
        const timeDifference = 400;
        const numberOfPostsToCache = 3;
        function cacheInBackground(postNr: number, offset: number) {
            setTimeout(() => {
                renderPost(getPostJson((postNr + offset) % numberOfPosts.value));
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
                content = `<video ${style} autoplay muted controls loop class="unselectable"><source src="${await blobToBase64(
                    mediaContents
                )}">Your browser does not support the video tag.</video>`;
            } else {
                // assume image mime type
                content = `<img src="${await blobToBase64(mediaContents)}"  ${style} class="unselectable"></img>`;
            }
        }

        // set html output
        const cacheElement = document.createElement("div");
        cacheElement.innerHTML = `<h4>${subreddit}</h4><h2>${title}</h2>${content}<h4>${author}</h4><span>${link}</span><div style="position: absolute; top:3em; bottom:6em; left: 0; right: 60%;" class="view_prev" class="unselectable"></div><div style="position: absolute; top:3em; bottom:6em; right: 0; left: 60%;" class="view_next" class="unselectable"></div>`;

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
        // get image files from zip and append to display
        if (selectedSession.value) {
            const postNumberToSelect = parseInt(localStorage.getItem(postNumberCacheKey(selectedSession.value)) ?? "0");
            selectPost(postNumberToSelect);
        }
    }

    const currentFilter = ref(getLastUsedFilter());
    const currentPosts = computed(() => {
        return filteredPosts(selectedSession.value?.posts ?? {}, currentFilter.value);
    });
    const ratingOverwrites = ref({} as { [key: string]: number });
    const currentPostRatingStars = computed(() => {
        if (selectedPost.value) {
            const post = currentPosts.value[selectedPost.value.id];

            if (post) {
                if (Object.keys(ratingOverwrites.value).includes(post.id)) {
                    return ratingOverwrites.value[post.id];
                } else {
                    return parseInt(getRating(post).stars);
                }
            }
        }

        return 0;
    });

    function getPostJson(index: number) {
        if (numberOfPosts.value == 0) {
            return null;
        } else {
            return currentPosts.value[randomnessMapping.value[index]];
        }
    }

    const numberOfPosts = computed(() => {
        if (currentPosts.value == null) {
            return 0;
        } else {
            return Object.keys(currentPosts.value).length;
        }
    });

    const postsRatingDirty = ref(false);

    async function handleRatingChange(newRating: number) {
        if (selectedPost.value) {
            // write into overwrite to reflect in UI
            ratingOverwrites.value[selectedPost.value.id] = newRating;

            // store into memory without touching the current session
            const sessionCopy = structuredClone(toRaw(selectedSession.value));
            if (sessionCopy) {
                Object.keys(ratingOverwrites.value).forEach((keyToOverwrittenPost) => {
                    const post = sessionCopy.posts[keyToOverwrittenPost];
                    if (post && post != null && post != undefined) {
                        getRating(post).stars = String(ratingOverwrites.value[keyToOverwrittenPost]); // store to copy of session, because post object is referenced by copy of session
                    }
                });

                await sessionsMetaStore.storeSessionInFilesystem(sessionCopy, scope);
                postsRatingDirty.value = true;
            }
        }
    }

    function handleNewFilter(newFilter: Filter) {
        currentFilter.value = newFilter;

        resetDisplay();
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

    <FilterVue @new-filter="handleNewFilter" :hidden="!selectedSession"></FilterVue>

    <br />
    <br />
    <RatingVue
        v-if="selectedPost && selectedSession"
        :ratingStars="currentPostRatingStars"
        @new-rating-selected="handleRatingChange"
        :key="selectedPost.id"
    ></RatingVue>
    <br />
    <div style="width: 100%; text-align: center" class="unselectable">
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
        <div style="visibility: hidden" hidden id="view_area_cache" class="unselectable"></div>
    </div>
    <br />
    <div style="width: 100%; text-align: center" class="unselectable">
        <div style="width: 60%; margin: auto">
            <input type="number" style="width: 20%" disabled v-model="currentPostNumber" /> /
            <span>{{ maxPostNumber }}</span>
            <span style="float: left; border: 1px solid black; cursor: pointer" @click="selectPrevImage">prev</span>
            <span style="float: right; border: 1px solid black; cursor: pointer" @click="selectNextImage">next</span>
        </div>
    </div>
</template>

<style scoped></style>
