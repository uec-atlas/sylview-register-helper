import type { MessagePayload } from "@/types/message";
import { handleIframeMessage } from "./utils/messaging";
import { resolveUserInfo } from "./utils/userInfo";

const FORM_SELECTOR = "#rishuReferUpdateForm";

export default defineContentScript({
  matches: ["https://campusweb.office.uec.ac.jp/campusweb/*"],
  runAt: "document_end",
  allFrames: true,
  cssInjectionMode: "ui",
  async main(ctx) {
    if (!document.title.includes("履修登録")) return;

    const info = resolveUserInfo();
    if (info.grade <= 0 || !info.department || !info.term) {
      console.error("Failed to detect user info");
      return;
    }

    const form = document.querySelector<HTMLElement>(FORM_SELECTOR);
    const jikanwariCodeInput =
      form?.querySelector<HTMLInputElement>("#jikanwariCode");
    if (!jikanwariCodeInput) return;

    const table = form?.querySelector(":scope > table");
    const day =
      table
        ?.querySelector("tr:nth-child(1) > td:nth-child(2)")
        ?.textContent?.trim() ?? "";
    const time =
      table
        ?.querySelector("tr:nth-child(2) > td:nth-child(2)")
        ?.textContent?.trim() ?? "";
    const period =
      day === "その他" ? "他" : `${day.slice(0, 1)}${time.slice(0, 1)}`;

    const ui = createIframeUi(ctx, {
      page: "/campussquare-iframe.html",
      position: "inline",
      anchor: FORM_SELECTOR,
      append: "last",
      onMount: (_, frame) => {
        frame.width = `${table?.clientWidth ?? 300}px`;
        frame.height = "600px";
        frame.style.border = "1px solid #dddddd";
      }
    });
    ui.mount();

    window.addEventListener(
      "message",
      (event: MessageEvent<MessagePayload>) => {
        if (event.origin !== browser.runtime.getURL("/").slice(0, -1)) {
          return;
        }
        handleIframeMessage(event, info, period, form);
      }
    );
  }
});
