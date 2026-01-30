import type { Syllabus } from "@/types/__generated__/graphql";
import type { Query } from "../App";
import { getCategoryInfo } from "./category";

export const sortSyllabuses = (query: Query) => (a: Syllabus, b: Syllabus) => {
  const categoryA = getCategoryInfo(a, query);
  const categoryB = getCategoryInfo(b, query);
  let score = 0;

  // 1. 学年
  // 2. 必修 > 選択
  // 3. 科目名
  score += ((b.grades?.[0] ?? 0) - (a.grades?.[0] ?? 10)) * 100;

  if (categoryA && categoryB) {
    if (categoryA.isRequired && !categoryB.isRequired) {
      score -= 10;
    } else if (!categoryA.isRequired && categoryB.isRequired) {
      score += 10;
    }
  } else if (categoryA && !categoryB) {
    score -= 1000;
  } else {
    score += 1000;
  }

  if (a.title && b.title) {
    score += a.title.localeCompare(b.title, "ja", { numeric: true }) || 0;
  }

  return score;
};
