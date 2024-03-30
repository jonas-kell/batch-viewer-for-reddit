import { defineStore } from "pinia";
import { ref } from "vue";
import { keyFromPassword } from "../functions/encrypt";

export default defineStore("keys", () => {
    const activeKeys = ref(
        {} as {
            [key: string]: {
                key: CryptoKey;
                password: string;
            };
        }
    );

    async function setKey(scope: string, password: string) {
        if (password == "") {
            unsetKey(scope);
        } else {
            activeKeys.value[scope] = {
                key: await keyFromPassword(password),
                password: password,
            };
        }
    }

    function unsetKey(scope: string) {
        delete activeKeys.value[scope];
    }

    function encryptionOn(scope: string) {
        if (activeKeys.value[scope] == undefined || activeKeys.value[scope] == null) {
            return false;
        } else {
            return true;
        }
    }

    function getKey(scope: string): CryptoKey {
        return activeKeys.value[scope].key;
    }

    function getPassword(scope: string): string {
        return activeKeys.value[scope]?.password ?? "";
    }

    return {
        setKey,
        unsetKey,
        encryptionOn,
        getKey,
        getPassword,
    };
});
