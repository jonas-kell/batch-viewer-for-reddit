<script setup lang="ts">
    import { nextTick, onMounted, ref } from "vue";
    import useSessionsMetaStore from "./../stores/sessionsMeta";
    import PasswordField from "./PasswordField.vue";
    import SessionSelectButtons from "./SessionSelectButtons.vue";
    import { MemorySession } from "../functions/interfaces";
    import toastr from "toastr";
    import SessionInfo from "./SessionInfo.vue";
    import { exportFromSourceToTarget } from "./../functions/exportContent";
    import useProgressStore from "./../stores/progress";

    const sessionsMetaStore = useSessionsMetaStore();
    const progressStore = useProgressStore();

    const scopeSource = "source";
    const scopeTarget = "target";
    onMounted(() => {
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scopeSource);
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scopeTarget);
    });

    const resetOutput = ref(false);
    const conversionRunning = ref(false);

    const selectedSessionSource = ref(null as MemorySession | null);
    function handleSourceSessionSelected(session: MemorySession | null) {
        selectedSessionSource.value = session;
        checkForConflicts();
    }
    const selectedSessionTarget = ref(null as MemorySession | null);
    function handleTargetSessionSelected(session: MemorySession | null) {
        selectedSessionTarget.value = session;
        checkForConflicts();
    }

    function checkForConflicts() {
        if (selectedSessionSource.value && selectedSessionTarget.value) {
            if (selectedSessionSource.value.name == selectedSessionTarget.value.name) {
                toastr.error("Can not output into self");

                resetOutput.value = true;
                nextTick(() => {
                    resetOutput.value = false;
                });
            }
        }
    }

    async function processConversion() {
        conversionRunning.value = true;
        try {
            if (selectedSessionSource.value != null) {
                await exportFromSourceToTarget(
                    selectedSessionSource.value,
                    scopeSource,
                    selectedSessionTarget.value,
                    scopeTarget
                );
            }
        } catch (error) {
            console.error(error);
            conversionRunning.value = false;
        }
        conversionRunning.value = false;
    }
</script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    <h2>Export Sessions</h2>
    <br /><br />

    <h3>Input Sessions</h3>
    <PasswordField
        :scope="scopeSource"
        hint="Insert Decryption Key"
        hintActivated="Encryption Activated"
        description="Decryption key (Needed if Source is encrypted):"
    ></PasswordField>
    <br />
    <br />
    <SessionSelectButtons
        defaultSelectionLabel="Please Choose Session"
        :scope="scopeSource"
        @sessionSelected="handleSourceSessionSelected"
    ></SessionSelectButtons>

    <br />
    <SessionInfo v-if="selectedSessionSource" :session="selectedSessionSource" :numPosts="true"></SessionInfo>

    <h3>Output Sessions</h3>
    <br />
    <PasswordField
        :scope="scopeTarget"
        hint="Insert Encryption Key"
        hintActivated="Encryption Activated"
        description="Encryption key (If set, the output will be encrypted):"
    ></PasswordField>
    <br />
    <br />
    <SessionSelectButtons
        defaultSelectionLabel="Download"
        :scope="scopeTarget"
        @sessionSelected="handleTargetSessionSelected"
        :reset="resetOutput"
    ></SessionSelectButtons>

    <br />
    <SessionInfo v-if="selectedSessionTarget" :session="selectedSessionTarget" :numPosts="true"></SessionInfo>

    <br />
    <h3>Settings</h3>
    <!-- TODO -->
    <div style="width: 100%; text-align: center; padding-bottom: 10em">
        <button
            :style="{
                background: conversionRunning || selectedSessionSource == null ? '' : 'green',
            }"
            :disabled="conversionRunning || selectedSessionSource == null"
            @click="processConversion"
        >
            Export the stuff
        </button>
        <div v-if="conversionRunning">
            <br />
            <b>Progress: </b> <span>Target: {{ progressStore.filesToDownload }}</span>
            <span style="color: green; margin-left: 2em">Success: {{ progressStore.fileSuccess }}</span>
            <span style="color: red; margin-left: 2em">Error: {{ progressStore.fileError }}</span>
            <span style="color: darkgoldenrod; margin-left: 2em">
                Pending: {{ progressStore.filesToDownload - progressStore.fileSuccess - progressStore.fileError }}
            </span>
        </div>
    </div>
</template>

<style scoped></style>
