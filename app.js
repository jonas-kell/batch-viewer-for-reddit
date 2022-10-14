if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("serviceworker.js");
}

$(document).ready(() => {
    console.log("Main js finished executing");
});
