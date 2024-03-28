// vite.config.js
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    // Configuration options
    base: "/",
    plugins: [
        vue(),
        viteStaticCopy({
            targets: [{ src: "assets/*", dest: "assets" }],
        }),
    ],
});
