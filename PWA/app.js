if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/serviceworker.js");
}

docReady(() => {
    console.log("works");
});

/** jquery replacement */
function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}
