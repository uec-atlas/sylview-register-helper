import type { FunctionalComponent } from "vue";
import HelloWorld from "@/components/HelloWorld.vue";
import vueLogo from "@/assets/vue.svg";

export const App: FunctionalComponent = () => {
  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank" rel="noopener">
          <img src="/wxt.svg" class="logo" alt="WXT logo" />
        </a>
        <a href="https://vuejs.org/" target="_blank" rel="noopener">
          <img src={vueLogo} class="logo vue" alt="Vue logo" />
        </a>
      </div>
      <HelloWorld msg="WXT + Vue" />
    </>
  );
};
