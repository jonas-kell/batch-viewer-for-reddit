import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore("progress", () => {
    const filesToDownload = ref(0);
    const fileSuccess = ref(0);
    const fileError = ref(0);

    function reset() {
        filesToDownload.value = 0;
        fileSuccess.value = 0;
        fileError.value = 0;
    }

    function addTarget() {
        filesToDownload.value += 1;
    }

    function setTarget(target: number) {
        filesToDownload.value = target;
    }

    function addSuccess() {
        fileSuccess.value += 1;
    }

    function addError() {
        fileSuccess.value += 1;
    }

    return {
        reset,
        addSuccess,
        addError,
        addTarget,
        setTarget,
        filesToDownload,
        fileSuccess,
        fileError,
    };
});
