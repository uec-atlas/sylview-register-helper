import { definePreset, palette } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";
import PrimeVue, { type PrimeVueConfiguration } from "primevue/config";
import { App } from "./App";
import "./assets/main.css";
import urql, { fetchExchange } from "@urql/vue";
import { cacheExchange } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";

const preset = definePreset(Aura, {
  semantic: {
    primary: palette("#396989")
  },
  components: {
    inputtext: {
      root: {
        borderRadius: "0rem"
      }
    },
    button: {
      root: {
        borderRadius: "0rem"
      }
    },
    tag: {
      root: {
        borderRadius: "0rem"
      }
    }
  }
});

const primeVueConfig: PrimeVueConfiguration = {
  theme: {
    preset,
    options: {
      darkModeSelector: ".dark"
    }
  }
};

const app = createApp(App);
app.use(PrimeVue, primeVueConfig);
app.use(urql, {
  url: "https://sylview.e-chan.me/api/graphql",
  exchanges: [
    cacheExchange({
      resolvers: {
        Query: {
          syllabuses: relayPagination()
        }
      },
      keys: {
        CreditCategory: () => null
      }
    }),
    fetchExchange
  ],
  fetchOptions: {
    cache: "force-cache"
  }
});
app.mount("#app");
