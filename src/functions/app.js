if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("serviceworker.js");
}

$(document).ready(() => {
    $("#update_app_button").on("click", function () {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then(async function (registrations) {
                for (let registration of registrations) {
                    await registration.update();
                    await registration.unregister(); // only updating doesn't seem to work. I probably misunderstand the docs
                    console.log("Updated and unregistered old service worker. Reload should install the new one");
                }

                // clear service worker cache
                await caches.delete("pwa-assets");

                // notify
                console.log("Cleared cache and updated app.");

                // hard reload with cache clear
                location.reload(true);
            });
        }
    });

    console.log("Main js finished executing");
});
