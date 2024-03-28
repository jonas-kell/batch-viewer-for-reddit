import { createApp } from "vue";
import "./styles/styles.css";
import App from "./App.vue";
import router from "./router.ts";

createApp(App).use(router).mount("#app");

// toastr
import "./../node_modules/toastr/build/toastr.min.css";
