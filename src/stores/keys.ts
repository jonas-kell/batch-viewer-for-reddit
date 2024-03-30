import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore("keys", () => {
    const activeKeys = ref({} as { [key: string]: CryptoKey });

    function setKey(scope: string = "page", password: string) {
        if (password == "") {
            unsetKey(scope);
        } else {
            // set the key
            //TODO
        }
    }

    function unsetKey(scope: string = "page") {
        delete activeKeys.value[scope];
    }

    function encryptionOn(scope: string = "page") {
        if (activeKeys.value[scope] == undefined || activeKeys.value[scope] == null) {
            return false;
        } else {
            return true;
        }
    }

    function getKey(scope: string = "page"): CryptoKey {
        return activeKeys.value[scope];
    }

    return {
        setKey,
        unsetKey,
        encryptionOn,
        getKey,
    };
});
