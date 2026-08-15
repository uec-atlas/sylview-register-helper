import { STORAGE_KEY_PREFIX } from "@/lib/constants";

const storageKey = (key: string) => `${STORAGE_KEY_PREFIX}${key}`;

const DEPARTMENT_XPATH =
  "//th[contains(text(), '所属')]/following-sibling::td/text()";
const GRADE_XPATH =
  "//th[contains(text(), '年次')]/following-sibling::td/text()";
const TERM_YEAR_XPATH =
  "//th[contains(text(), '年度・学期')]/following-sibling::td/text()";

function evaluateText(xpath: string): string {
  return document
    .evaluate(xpath, document, null, XPathResult.STRING_TYPE)
    .stringValue.trim();
}

export interface UserInfo {
  department: string;
  grade: number;
  year: number;
  term: string;
}

export function readUserInfoFromPage(): UserInfo {
  const department = evaluateText(DEPARTMENT_XPATH);
  const grade = evaluateText(GRADE_XPATH).slice(0, 1);
  const termYearText = evaluateText(TERM_YEAR_XPATH);
  const year = termYearText.match(/(\d+)年度/)?.[1] ?? "";
  const term = termYearText.match(/(.)ﾀｰﾑ/)?.[1] ?? "";

  return {
    department,
    grade: grade ? Number.parseInt(grade, 10) : 0,
    year: year ? Number.parseInt(year, 10) : 0,
    term
  };
}

export function readUserInfoFromStorage(): UserInfo {
  return {
    department: sessionStorage.getItem(storageKey("department")) ?? "",
    grade:
      Number.parseInt(sessionStorage.getItem(storageKey("grade")) ?? "", 10) ||
      0,
    year:
      Number.parseInt(sessionStorage.getItem(storageKey("year")) ?? "", 10) ||
      0,
    term: sessionStorage.getItem(storageKey("term")) ?? ""
  };
}

export function saveUserInfoToStorage(info: UserInfo): void {
  if (info.year > 0)
    sessionStorage.setItem(storageKey("year"), String(info.year));
  if (info.grade > 0)
    sessionStorage.setItem(storageKey("grade"), String(info.grade));
  if (info.department)
    sessionStorage.setItem(storageKey("department"), info.department);
  if (info.term) sessionStorage.setItem(storageKey("term"), info.term);
}

export function resolveUserInfo(): UserInfo {
  const fromPage = readUserInfoFromPage();
  const fromStorage = readUserInfoFromStorage();
  const info: UserInfo = {
    department: fromPage.department || fromStorage.department,
    grade: fromPage.grade || fromStorage.grade,
    year: fromPage.year || fromStorage.year,
    term: fromPage.term || fromStorage.term
  };
  saveUserInfoToStorage(info);
  return info;
}
