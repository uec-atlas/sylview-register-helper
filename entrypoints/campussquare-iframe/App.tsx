import { IftaLabel, InputText, VirtualScroller } from "primevue";
import { buildTreeFromNodeData } from "@/lib/AbstractTree";
import { Department } from "@/lib/schema";
import type { Message, RequestInfoMessage } from "@/types/message";
import logo from "./assets/logo.svg";

const _departments = await fetch("https://sylview.e-chan.me/api/departments").then(res => res.json());
const departments = buildTreeFromNodeData<Department>(_departments, (d, parent) => new Department(d.id, d.name, d.hidden, [], parent));

export const App = defineComponent(() => {
  const value = ref("");
  const items = Array.from({ length: 1000 }).map((_, i) => `Item ${i}`);
  const grade = ref(1);
  const term = ref("");
  const departmentNames = ref<string[]>([]);
  const departmentIds = computed(() =>
    departmentNames.value.map(name => departments.findDescendant(node => node.name === name)?.id).filter(v => v !== undefined)
  );
  const period = ref("");

  const listener = (event: MessageEvent<Message>) => {
    if (event.origin !== "https://campusweb.office.uec.ac.jp") {
      return;
    }
    const { type, data } = event.data;
    switch (type) {
      case "responseInfo": {
        console.log("received filter", data);
        grade.value = data.grade;
        term.value = data.term;
        const departmentMatch = data.department.match(/情報理工学域([ⅠⅡⅢ])類(.+)/)
        departmentNames.value = [];
        if(departmentMatch) {
          const departmentKey = { "Ⅰ": "I類 (情報系)", "Ⅱ": "II類 (融合系)", "Ⅲ": "III類 (理工系)" }[departmentMatch[1]] ?? "";
          departmentNames.value.push(departmentKey, "昼間コース");
          if(departmentMatch.length >= 3) departmentNames.value.push(`${departmentMatch[2]}プログラム`);
        } else if(data.department.includes("先端工学基礎課程")) {
          departmentNames.value.push("夜間コース", "先端工学基礎課程");
        }
        period.value = data.period;
        window.removeEventListener("message", listener);
        break;
      }
    }
  };
  window.addEventListener("message", listener);

  onMounted(() => {
    window.parent.postMessage(
      { type: "requestInfo" } as RequestInfoMessage,
      "https://campusweb.office.uec.ac.jp"
    );
  });

  return () => (
    <div>
      <header class="flex flex-row align-center justify-between p-2">
        <h1 class="text-primary-600 text-2xl font-bold">時間割コード検索</h1>
        <a
          href="https://sylview.e-chan.me/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img alt="UEC SylView" src={logo} class="h-8" />
        </a>
      </header>
      <section class="p-2">
        <h2>検索条件</h2>
        <IftaLabel>
          <InputText
            id="department"
            value={departmentNames.value.filter(v => !v.endsWith("コース")).join(" ")}
            variant="filled"
            readonly
            fluid
            size="small"
          />
          <label for="department">課程・類・プログラム</label>
        </IftaLabel>
      </section>
      <VirtualScroller items={items} itemSize={20} style={{ height: "300px" }}>
        {{
          item: ({ item }) => <div style={{ padding: "4px" }}>{item}</div>
        }}
      </VirtualScroller>
    </div>
  );
});
