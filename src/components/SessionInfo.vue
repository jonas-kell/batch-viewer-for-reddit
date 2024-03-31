<script setup lang="ts">
    import { MemorySession } from "../functions/interfaces";
    import { getSessionDataFileCompleteSize, getSessionNumberOfDataFileNames, sizeToString } from "../functions/opfs";

    defineProps({
        session: {
            type: Object as () => MemorySession | null,
            required: true,
        },
        numPosts: {
            type: Boolean,
            default: false,
        },
        listFiles: {
            type: Boolean,
            default: true,
        },
    });
</script>

<template>
    <template v-if="session != null">
        <template v-if="numPosts">
            <div>
                Posts in the session: <b>{{ Object.keys(session.posts).length }}</b>
            </div>
            <br />
        </template>

        Files stored in the session: <b>{{ getSessionNumberOfDataFileNames(session) }}</b>
        <template v-if="!listFiles"> ({{ sizeToString(getSessionDataFileCompleteSize(session)) }}) </template>
        <ul v-if="listFiles">
            <li v-for="entry in session.file_meta">
                <b>{{ entry.name }} </b> ({{ sizeToString(entry.size) }})
            </li>
        </ul>
    </template>
</template>

<style scoped></style>
