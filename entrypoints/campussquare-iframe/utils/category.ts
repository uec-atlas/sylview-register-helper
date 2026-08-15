import type { SyllabusCard } from "@/lib/sparql";

export const getCategoryInfo = (syllabus: SyllabusCard) => {
  const category = syllabus.category;
  if (!category) return null;

  return {
    categoryNames: category.categoryNames,
    isRequired: category.isRequired
  };
};
