import type { MessagePayload, ResponseInfoMessage } from "@/types/message";
import type { UserInfo } from "./userInfo";

function getCodeInput(form: HTMLElement | null): HTMLInputElement | null {
  return form?.querySelector<HTMLInputElement>("#jikanwariCode") ?? null;
}

function clickSyllabusRefer(form: HTMLElement | null): void {
  form
    ?.querySelector<HTMLInputElement>("input[value*='シラバス参照']")
    ?.click();
}

export function handleIframeMessage(
  event: MessageEvent<MessagePayload>,
  info: UserInfo,
  period: string,
  form: HTMLElement | null
) {
  const { type, data } = event.data;
  switch (type) {
    case "requestInfo": {
      const response: ResponseInfoMessage = {
        type: "responseInfo",
        data: {
          grade: info.grade,
          term: info.term,
          department: info.department,
          period,
          year: info.year
        }
      };
      event.source?.postMessage(response, { targetOrigin: event.origin });
      break;
    }
    case "requestInputCode": {
      const input = getCodeInput(form);
      if (input) input.value = data.timeTableCode;
      break;
    }
    case "requestOpenSyllabus": {
      const input = getCodeInput(form);
      if (!input) return;
      const stash = input.value;
      input.value = data.timeTableCode;
      clickSyllabusRefer(form);
      input.value = stash;
      break;
    }
  }
}
