import { defineConfig } from "wxt";
import vueJsx from "@vitejs/plugin-vue-jsx";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  // @ts-expect-error
  vite: () => ({
    plugins: [
      vueJsx(),
      tailwindcss(),
      Components({
        resolvers: [PrimeVueResolver()]
      })
    ]
  }),
  manifest: {
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    default_locale: "ja",
    web_accessible_resources: [
      {
        resources: ["campussquare-iframe.html"],
        matches: ["https://campusweb.office.uec.ac.jp/*"]
      }
    ]
  }
});
