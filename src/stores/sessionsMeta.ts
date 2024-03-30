import { defineStore } from "pinia";
import { ref } from "vue";
import { MemorySession } from "../functions/interfaces";
import useKeysStore from "./keys";
import { createSession as createSessionOPFS, deleteSession as deleteSessionOPFS } from "./../functions/opfs";
import toastr from "toastr";

export default defineStore("keys", () => {
    const sessions = ref({} as { [key: string]: { [key: string]: MemorySession } });

    function getSession(sessionName: string = "page", scope: string): MemorySession | null {
        let obj = sessions.value[scope] ?? {};
        let res = obj[sessionName];

        if (res != undefined) {
            return res;
        }
        return null;
    }

    async function createSession(scope: string) {
        let sessionName = "Session_" + String(Date.now()) + (useKeysStore().encryptionOn(scope) ? "_encrypted" : "");

        await createSessionOPFS(sessionName, scope);
    }

    async function deleteSession(session: MemorySession) {
        await deleteSessionOPFS(session.name);
    }

    function sessionSelectableCheck(sessionName: string, scope: string) {
        if (Object.keys(sessions.value[scope]).includes(sessionName)) {
            if (sessions.value[scope][sessionName].can_be_decrypted ?? false) {
                return true;
            } else {
                toastr.error("Encrypted session can not be selected without key");
            }
        } else {
            if (sessionName != "default") {
                toastr.error("Key not found in sessionsMeta cache");
            } else {
                toastr.success("Selected default operation");
            }
        }
        return false;
    }

    return {
        getSession,
        createSession,
        deleteSession,
        sessionSelectableCheck,
    };
});
