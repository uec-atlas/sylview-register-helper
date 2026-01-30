import type { Syllabus } from "@/types/__generated__/graphql";
import type { Query } from "../App";

export const getCategoryInfo = (syllabus: Syllabus, query: Query) => {
  if (!syllabus.creditCategories || !query.departmentNames.length) return null;
  const targetCategory = syllabus.creditCategories.find(
    (cc) =>
      cc.department?.name && query.departmentNames.includes(cc.department.name)
  );
  if (!targetCategory) return null;
  const categoryNames: string[] = [];
  let currentCategory = targetCategory.category;
  while (currentCategory) {
    if (currentCategory.name) categoryNames.unshift(currentCategory.name);
    currentCategory = currentCategory.parent;
  }
  return {
    categoryNames: categoryNames,
    isRequired: targetCategory.isRequired
  };
};
