import { defineStore } from "pinia";
import { ref } from "vue";
import { MemorySession } from "../functions/interfaces";
import useKeysStore from "./keys";
import {
    createSession as createSessionOPFS,
    deleteSession as deleteSessionOPFS,
    parseSessionsMetaFromFilesystem,
    includePostsFileInSessionAndUploadToOPFS,
} from "./../functions/opfs";
import toastr from "toastr";

export default defineStore("sessionsMeta", () => {
    const sessions = ref({} as { [key: string]: { [key: string]: MemorySession } });

    function getSession(sessionName: string, scope: string): MemorySession | null {
        let obj = sessions.value[scope] ?? {};
        let res = obj[sessionName];

        if (res != undefined) {
            return res;
        }
        return null;
    }

    function getSessionNames(scope: string): string[] {
        let obj = sessions.value[scope] ?? {};

        return Object.keys(obj);
    }

    function getSessions(scope: string): MemorySession[] {
        let agg: MemorySession[] = [];

        getSessionNames(scope).forEach((sessionName) => {
            const session = getSession(sessionName, scope);

            if (session) {
                agg.push(session);
            }
        });

        return agg;
    }

    async function createSession(scope: string) {
        let sessionName = "Session_" + String(Date.now()) + (useKeysStore().encryptionOn(scope) ? "_encrypted" : "");

        await createSessionOPFS(sessionName, scope);
        await reParseLocalSessionCacheFromFiles(scope);
    }

    async function deleteSession(session: MemorySession, scope: string) {
        await deleteSessionOPFS(session.name);
        await reParseLocalSessionCacheFromFiles(scope);
    }

    /**
     *  DOES NOT RE-COMPUTE SESSIONS. MUST DO MANUALLY
     */
    async function addFileToSession(session: MemorySession, file: File, scope: string) {
        await includePostsFileInSessionAndUploadToOPFS(file, session, scope);
    }

    function sessionSelectableCheck(sessionName: string, scope: string) {
        if (Object.keys(sessions.value[scope]).includes(sessionName)) {
            if (sessions.value[scope][sessionName].is_encrypted) {
                // check for encrypted sessions
                if (sessions.value[scope][sessionName].can_be_decrypted ?? false) {
                    return true;
                } else {
                    toastr.error("Encrypted session can not be selected without key");
                }
            } else {
                // only allow for encryption not activated to be selected
                if (!useKeysStore().encryptionOn(scope)) {
                    return true;
                } else {
                    toastr.error("Un-encrypted session can not be selected when encryption is active");
                }
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

    async function reParseLocalSessionCacheFromFiles(scope: string) {
        let newValues = await parseSessionsMetaFromFilesystem(scope);
        sessions.value[scope] = newValues;
    }

    return {
        getSession,
        createSession,
        deleteSession,
        sessionSelectableCheck,
        getSessionNames,
        getSessions,
        reParseLocalSessionCacheFromFiles,
        addFileToSession,
    };
});
