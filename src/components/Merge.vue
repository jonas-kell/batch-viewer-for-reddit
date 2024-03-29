<script setup lang="ts"></script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    <h2>Merge Collections</h2>

    This is only supported on chrome currently (no mobile), because it requires an api that is not available to basically every
    other browser.<br />

    <button id="open_zip">Open Zip</button><br />
    Make sure to only merge collections with the same encryption key to have no limited viewing experience.
    <br />
    <br />

    <div id="selected_zip_display"></div>
    <br />
    <button id="merge_action">MERGE</button>
</template>

<style scoped></style>
