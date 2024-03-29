import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore("keys", () => {
    const active_keys = ref({} as { [key: string]: CryptoKey });

    function setKey(scope: string = "page", password: string) {
        if (password == "") {
            unsetKey(scope);
        } else {
            // set the key
            //TODO
        }
    }

    function unsetKey(scope: string = "page") {
        delete active_keys.value[scope];
    }

    function encryptionOn(scope: string = "page") {
        if (active_keys.value[scope] == undefined || active_keys.value[scope] == null) {
            return false;
        } else {
            return true;
        }
    }

    function getKey(scope: string = "page"): CryptoKey {
        return active_keys.value[scope];
    }

    return {
        setKey,
        unsetKey,
        encryptionOn,
        getKey,
    };
});
