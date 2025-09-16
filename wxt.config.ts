import { defineConfig } from "wxt";
import vueJsx from "@vitejs/plugin-vue-jsx";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  vite: () => ({
    plugins: [vueJsx()]
  }),
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: "ja"
  }
});
