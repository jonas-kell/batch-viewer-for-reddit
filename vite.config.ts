// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    // Configuration options
    base: "/",
    plugins: [
        vue(),
        VitePWA({
            registerType: "autoUpdate",
            devOptions: {
                enabled: true,
            },
            includeAssets: [
                "favicon.ico",
                "assets/favicons/apple-touch-icon.png",
                "assets/favicons/favicon-16x16.png",
                "assets/favicons/favicon-32x32.png",
                "assets/favicons/safari-pinned-tab.svg",
            ],
            manifest: {
                name: "Batch Viewer For Reddit",
                id: "batch-viewer-for-reddit-2.0",
                theme_color: "#1976d2",
                background_color: "#fafafa",
                display: "standalone",
                icons: [
                    {
                        src: "assets/icons/icon-72x72.png",
                        sizes: "72x72",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                    {
                        src: "assets/icons/icon-96x96.png",
                        sizes: "96x96",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                    {
                        src: "assets/icons/icon-128x128.png",
                        sizes: "128x128",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                    {
                        src: "assets/icons/icon-144x144.png",
                        sizes: "144x144",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                    {
                        src: "assets/icons/icon-152x152.png",
                        sizes: "152x152",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                    {
                        src: "assets/icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                    {
                        src: "assets/icons/icon-384x384.png",
                        sizes: "384x384",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                    {
                        src: "assets/icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                ],
            },
        }),
    ],
});
