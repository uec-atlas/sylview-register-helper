import { defineConfig } from "wxt";
import vueJsx from "@vitejs/plugin-vue-jsx";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  vite: () => ({
    plugins: [
      vueJsx(),
      tailwindcss(),
      Components({
        resolvers: [PrimeVueResolver()]
      })
    ]
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
        // @ts-expect-error Firefox-specific field
        data_collection_permissions: {
          required: ["none"]
        }
      }
    }
  }
});
