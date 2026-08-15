import type { SyllabusCard } from "@/lib/sparql";
import { getCategoryInfo } from "./category";

const USER_ORG_PRIORITY = 10000;
const GRADE_WEIGHT = 100;
const CATEGORY_PRIORITY = 1000;
const REQUIRED_PRIORITY = 10;

export const sortSyllabuses = (a: SyllabusCard, b: SyllabusCard) => {
  const categoryA = getCategoryInfo(a);
  const categoryB = getCategoryInfo(b);
  let score = 0;

  if (a.belongsToUserOrg && !b.belongsToUserOrg) score -= USER_ORG_PRIORITY;
  else if (!a.belongsToUserOrg && b.belongsToUserOrg)
    score += USER_ORG_PRIORITY;

  score +=
    ((b.targetGrades?.[0] ?? 0) - (a.targetGrades?.[0] ?? 10)) * GRADE_WEIGHT;

  if (categoryA && !categoryB) score -= CATEGORY_PRIORITY;
  else if (!categoryA && categoryB) score += CATEGORY_PRIORITY;

  if (categoryA && categoryB) {
    if (categoryA.isRequired && !categoryB.isRequired) {
      score -= REQUIRED_PRIORITY;
    } else if (!categoryA.isRequired && categoryB.isRequired) {
      score += REQUIRED_PRIORITY;
    }
  }

  if (a.title && b.title) {
    score += a.title.localeCompare(b.title, "ja", { numeric: true }) || 0;
  }

  return score;
};
