import { createWebHashHistory, createRouter } from "vue-router";

import ComponentA from "./components/A.vue";
import ComponentB from "./components/B.vue";

const routes = [
    { path: "/", component: ComponentA },
    { path: "/b", component: ComponentB },
];

export default createRouter({
    history: createWebHashHistory(),
    routes,
});
