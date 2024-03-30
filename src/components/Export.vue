<script setup lang="ts">
    import { nextTick, onMounted, ref } from "vue";
    import useSessionsMetaStore from "./../stores/sessionsMeta";
    import PasswordField from "./PasswordField.vue";
    import SessionSelectButtons from "./SessionSelectButtons.vue";
    import { MemorySession } from "../functions/interfaces";
    import toastr from "toastr";

    const sessionsMetaStore = useSessionsMetaStore();

    const scopeSource = "source";
    const scopeTarget = "target";
    onMounted(() => {
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scopeSource);
        sessionsMetaStore.reParseLocalSessionCacheFromFiles(scopeTarget);
    });

    const resetOutput = ref(false);

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
        description="Decryption key (Needed if SOurce is encrypted):"
    ></PasswordField>
    <br />
    <br />
    <SessionSelectButtons
        defaultSelectionLabel="Download"
        :scope="scopeSource"
        @sessionSelected="handleSourceSessionSelected"
    ></SessionSelectButtons>

    <br /><br />
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
</template>

<style scoped></style>
