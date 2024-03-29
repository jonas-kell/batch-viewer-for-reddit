import { createWebHashHistory, createRouter } from "vue-router";

import Index from "./components/Index.vue";
import RedirectIndex from "./components/RedirectIndex.vue";
import Archive from "./components/Archive.vue";
import Export from "./components/Export.vue";
import Manage from "./components/Manage.vue";
import Merge from "./components/Merge.vue";
import Session from "./components/Session.vue";

const routes = [
    { path: "/", component: Index, name: "index" },
    { path: "/archive", component: Archive },
    { path: "/export", component: Export },
    { path: "/manage", component: Manage },
    { path: "/merge", component: Merge },
    { path: "/session", component: Session },
    { path: "/:catchAll(.*)*", component: RedirectIndex },
];

export default createRouter({
    history: createWebHashHistory(),
    routes,
});
