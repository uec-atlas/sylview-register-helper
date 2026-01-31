import type { MessagePayload, ResponseInfoMessage } from "@/types/message";

const storageKey = (key: string) => `sylview_${key}`;

export default defineContentScript({
  matches: ["https://campusweb.office.uec.ac.jp/campusweb/*"],
  runAt: "document_end",
  allFrames: true,
  cssInjectionMode: "ui",
  async main(ctx) {
    if (!document.title.includes("履修登録")) return;

    const department =
      document
        .evaluate(
          "//th[contains(text(), '所属')]/following-sibling::td/text()",
          document,
          null,
          XPathResult.STRING_TYPE
        )
        .stringValue.trim() ||
      sessionStorage.getItem(storageKey("department")) ||
      "";
    const grade =
      document
        .evaluate(
          "//th[contains(text(), '年次')]/following-sibling::td/text()",
          document,
          null,
          XPathResult.STRING_TYPE
        )
        .stringValue.trim()
        .slice(0, 1) ||
      sessionStorage.getItem(storageKey("grade")) ||
      "";
    const term =
      document
        .evaluate(
          "//th[contains(text(), '年度・学期')]/following-sibling::td/text()",
          document,
          null,
          XPathResult.STRING_TYPE
        )
        .stringValue.trim()
        .match(/(.)ﾀｰﾑ/)?.[1] ||
      sessionStorage.getItem(storageKey("term")) ||
      "";
    if (grade.length > 0) {
      sessionStorage.setItem(storageKey("grade"), grade);
    }
    if (department.length > 0) {
      sessionStorage.setItem(storageKey("department"), department);
    }
    if (term.length > 0) {
      sessionStorage.setItem(storageKey("term"), term);
    }

    if (grade.length <= 0 || department.length <= 0 || term.length <= 0) {
      console.error("Failed to detect user info");
      return;
    }

    const jikanwariCodeInput = document.querySelector(
      "#rishuReferUpdateForm #jikanwariCode"
    ) as HTMLInputElement | null;
    if (jikanwariCodeInput) {
      const table = document.querySelector("#rishuReferUpdateForm > table");
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
        anchor: "#rishuReferUpdateForm",
        append: "last",
        onMount: (_, frame) => {
          frame.width = `${document.querySelector("#rishuReferUpdateForm table")?.clientWidth ?? 300}px`;
          frame.height = "500px";
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
          const jikanwariCodeInput = document.querySelector(
            "#rishuReferUpdateForm #jikanwariCode"
          ) as HTMLInputElement | null;
          if (!jikanwariCodeInput) return;
          const syllabusReferButton = document.querySelector(
            "#rishuReferUpdateForm input[value*='シラバス参照']"
          ) as HTMLInputElement | null;
          const syllabusRefer = () => syllabusReferButton?.click();

          const { type, data } = event.data;
          switch (type) {
            case "requestInfo": {
              const grade = Number.parseInt(
                sessionStorage.getItem(storageKey("grade")) ?? "",
                10
              );
              const term = sessionStorage.getItem(storageKey("term")) ?? "";
              const department =
                sessionStorage.getItem(storageKey("department")) ?? "";
              const response: ResponseInfoMessage = {
                type: "responseInfo",
                data: {
                  grade,
                  term,
                  department,
                  period
                }
              };
              event.source?.postMessage(response, {
                targetOrigin: event.origin
              });
              break;
            }
            case "requestInputCode": {
              jikanwariCodeInput.value = data.timeTableCode;
              break;
            }
            case "requestOpenSyllabus": {
              const stash = jikanwariCodeInput.value;
              jikanwariCodeInput.value = data.timeTableCode;
              syllabusRefer();
              jikanwariCodeInput.value = stash;
              break;
            }
          }
        }
      );
    }
  }
});
