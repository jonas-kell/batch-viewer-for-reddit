import { createWebHashHistory, createRouter } from "vue-router";

import Index from "./components/Index.vue";
import RedirectIndex from "./components/RedirectIndex.vue";
import Archive from "./components/Archive.vue";
import Export from "./components/Export.vue";
import View from "./components/View.vue";
import Merge from "./components/Merge.vue";
import Sessions from "./components/Sessions.vue";

const routes = [
    { path: "/", component: Index, name: "index" },
    { path: "/archive", component: Archive },
    { path: "/export", component: Export },
    { path: "/merge", component: Merge },
    { path: "/view", component: View },
    { path: "/sessions", component: Sessions },
    { path: "/:catchAll(.*)*", component: RedirectIndex },
];

export default createRouter({
    history: createWebHashHistory(),
    routes,
});
