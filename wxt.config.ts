import tailwindcss from "@tailwindcss/vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  vite: () => ({
    plugins: [vueJsx(), tailwindcss()]
  }),
  manifestVersion: 3,
  manifest: {
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    default_locale: "ja",
    web_accessible_resources: [
      {
        resources: ["campussquare-iframe.html"],
        matches: ["https://campusweb.office.uec.ac.jp/*"]
      }
    ],
    browser_specific_settings: {
      gecko: {
        id: "{a0ad50e5-c1aa-445e-a279-ac79899b5705}",
        data_collection_permissions: {
          required: ["none"]
        }
      }
    }
  }
});
