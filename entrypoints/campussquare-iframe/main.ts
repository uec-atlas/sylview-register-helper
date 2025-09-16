import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";
import PrimeVue, { type PrimeVueConfiguration } from "primevue/config";
import { App } from "./App";
import "./assets/main.css";

const preset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{cyan-50}",
      100: "{cyan-100}",
      200: "{cyan-200}",
      300: "{cyan-300}",
      400: "{cyan-400}",
      500: "{cyan-500}",
      600: "{cyan-600}",
      700: "{cyan-700}",
      800: "{cyan-800}",
      900: "{cyan-900}",
      950: "{cyan-950}"
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
app.mount("#app");
