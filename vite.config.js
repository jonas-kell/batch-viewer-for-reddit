// vite.config.js
import { defineConfig } from "vite";
import copy from "vite-plugin-copy";

export default defineConfig({
    // Configuration options
    base: "/", // Adjust the base URL if needed
    build: {
        rollupOptions: {
            input: {
                main: "src/app.js", // Change 'src/main.js' to your entry JavaScript file
            },
        },
    },
    html: {
        title: "Batch Viewer for Reddit",
        meta: [
            { charset: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
            { name: "description", content: "Author: J.Kell, Tool to scrape reddit posts for offline viewing." },
            { name: "theme-color", content: "red", media: "(prefers-color-scheme: dark)" },
            {
                name: "msapplication-TileColor",
                content: "#da532c",
            },
        ],
        links: [
            { rel: "stylesheet", href: "styles.css" },
            { rel: "stylesheet", href: "toastr.css" },
            { rel: "manifest", href: "app.webmanifest" },
            { rel: "apple-touch-icon", sizes: "180x180", href: "assets/favicons/apple-touch-icon.png" },
            { rel: "icon", type: "image/png", sizes: "32x32", href: "assets/favicons/favicon-32x32.png" },
            { rel: "icon", type: "image/png", sizes: "16x16", href: "assets/favicons/favicon-16x16.png" },
            { rel: "mask-icon", href: "assets/favicons/safari-pinned-tab.svg", color: "#5bbad5" },
        ],
    },
    plugins: [
        copy({
            targets: [{ src: "assets/*", dest: "dist/assets" }],
            clean: true,
        }),
    ],
});
