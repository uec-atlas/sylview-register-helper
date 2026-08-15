import { query } from "./client";
import { getMasterData } from "./master";
import {
  buildCategoryMappingQuery,
  buildCategoryRequirementQuery,
  buildCourseInfoQuery,
  buildLecturesQuery
} from "./queries";

export type { SparqlBinding, SparqlError, SparqlResults } from "./client";
export { query } from "./client";

// ユーザー所属 org 群の mapping に現れるコース集合からカテゴリの単位総和を計算する。
// 同じコースは複数の org の mapping に現れうるため Set でユニーク化する。
function creditSumOfUserOrgs(
  categoryId: string,
  orgIdSet: Set<string>,
  coursesOfOrgCategory: Map<string, Set<string>>,
  creditOfCourse: Map<string, number>
): number {
  const courses = new Set<string>();
  for (const orgId of orgIdSet) {
    for (const courseId of coursesOfOrgCategory.get(`${orgId}|${categoryId}`) ??
      []) {
      courses.add(courseId);
    }
  }
  let total = 0;
  for (const courseId of courses) {
    total += creditOfCourse.get(courseId) ?? 0;
  }
  return total;
}

export interface SyllabusCard {
  id: string;
  title: string;
  timeTableCode: string;
  term: string;
  period: string;
  targetGrades: number[];
  instructors: string[];
  courseIds: string[];
  category?: {
    orgName: string;
    categoryNames: string[];
    isRequired: boolean;
  };
  belongsToUserOrg: boolean;
}

interface FetchSyllabusCardsParams {
  periods: string[];
  terms: string[];
  year: number;
  orgIds?: string[];
}

export async function fetchSyllabusCards(
  params: FetchSyllabusCardsParams
): Promise<SyllabusCard[]> {
  const orgIdSet = new Set(params.orgIds ?? []);

  const orgIdList = [...orgIdSet];
  const [masterData, lectures, mappings, categoryRequirements] =
    await Promise.all([
      getMasterData(),
      query(buildLecturesQuery(params)),
      orgIdList.length > 0
        ? query(buildCategoryMappingQuery(orgIdList))
        : Promise.resolve({ results: { bindings: [] } }),
      orgIdList.length > 0
        ? query(buildCategoryRequirementQuery(orgIdList))
        : Promise.resolve({ results: { bindings: [] } })
    ]);
  const { categoryPathMap, requiredCourseIds, creditOfCourse } = masterData;

  // ユーザー所属 org 群の mapping / categoryRequirement からカテゴリ構成を組み立てる。
  const coursesOfOrgCategory = new Map<string, Set<string>>();
  for (const b of mappings.results.bindings) {
    const org = b.org?.value;
    const category = b.categoryId?.value;
    const course = b.course?.value;
    if (!org || !category || !course) continue;
    const key = `${org}|${category}`;
    let courses = coursesOfOrgCategory.get(key);
    if (!courses) {
      courses = new Set();
      coursesOfOrgCategory.set(key, courses);
    }
    courses.add(course);
  }
  const minCreditsOfOrgCategory = new Map<string, number[]>();
  for (const b of categoryRequirements.results.bindings) {
    const org = b.org?.value;
    const category = b.categoryId?.value;
    const min = Number(b.minCredits?.value ?? 0);
    if (!org || !category || !min) continue;
    const key = `${org}|${category}`;
    let mins = minCreditsOfOrgCategory.get(key);
    if (!mins) {
      mins = [];
      minCreditsOfOrgCategory.set(key, mins);
    }
    mins.push(min);
  }

  const courses = [
    ...new Set(
      lectures.results.bindings
        .map((b) => b.course?.value)
        .filter((v): v is string => Boolean(v))
    )
  ];
  const courseInfoResult =
    courses.length > 0
      ? await query(buildCourseInfoQuery(courses))
      : { results: { bindings: [] } };

  const courseInfoMap = new Map<
    string,
    {
      orgIds: Set<string>;
      orgNameOf: Map<string, string>;
      categoryIdsOfOrg: Map<string, Set<string>>;
    }
  >();
  for (const b of courseInfoResult.results.bindings) {
    const courseId = b.course?.value;
    if (!courseId) continue;
    let info = courseInfoMap.get(courseId);
    if (!info) {
      info = {
        orgIds: new Set(),
        orgNameOf: new Map(),
        categoryIdsOfOrg: new Map()
      };
      courseInfoMap.set(courseId, info);
    }
    const orgId = b.org?.value;
    if (orgId) {
      info.orgIds.add(orgId);
      if (b.orgName?.value && !info.orgNameOf.has(orgId)) {
        info.orgNameOf.set(orgId, b.orgName.value);
      }
    }
    const mappingOrg = b.mappingOrg?.value;
    const categoryId = b.categoryId?.value;
    if (mappingOrg && categoryId) {
      let categories = info.categoryIdsOfOrg.get(mappingOrg);
      if (!categories) {
        categories = new Set();
        info.categoryIdsOfOrg.set(mappingOrg, categories);
      }
      categories.add(categoryId);
    }
  }

  const lectureMap = new Map<
    string,
    {
      name: string;
      timeTableCode: string;
      term: string;
      period: string;
      targetGrades: number[];
      instructors: string[];
      courseIds: Set<string>;
      categoryIds: Set<string>;
      orgName: string;
      orgIds: Set<string>;
    }
  >();

  const anyTerm = params.terms[0] ?? "";
  const anyPeriod = params.periods[0] ?? "";

  for (const b of lectures.results.bindings) {
    const lectureId = b.lecture?.value;
    if (!lectureId) continue;

    if (!lectureMap.has(lectureId)) {
      lectureMap.set(lectureId, {
        name: b.name?.value ?? "",
        timeTableCode: b.timetableCode?.value ?? "",
        term: anyTerm,
        period: anyPeriod,
        targetGrades: (b.grades?.value ?? "")
          .split(",")
          .filter(Boolean)
          .map(Number),
        instructors: (b.instructorNames?.value ?? "")
          .split(",")
          .filter(Boolean),
        courseIds: new Set(),
        categoryIds: new Set(),
        orgName: "",
        orgIds: new Set()
      });
    }

    const entry = lectureMap.get(lectureId);
    if (!entry) continue;
    const courseId = b.course?.value;
    if (courseId) {
      entry.courseIds.add(courseId);
      const info = courseInfoMap.get(courseId);
      if (!info) continue;
      for (const orgId of info.orgIds) {
        entry.orgIds.add(orgId);
        if (!entry.orgName) entry.orgName = info.orgNameOf.get(orgId) ?? "";
      }
      for (const userOrgId of orgIdSet) {
        for (const categoryId of info.categoryIdsOfOrg.get(userOrgId) ?? []) {
          entry.categoryIds.add(categoryId);
        }
      }
    }
  }

  return Array.from(lectureMap.entries()).map(([id, lecture]) => {
    const belongsToUserOrg =
      orgIdSet.size === 0 ||
      [...lecture.orgIds].some((orgId) => orgIdSet.has(orgId));

    let category:
      | { orgName: string; categoryNames: string[]; isRequired: boolean }
      | undefined;
    let bestPath: string[] = [];
    let isRequired = false;

    if (belongsToUserOrg) {
      // 他組織開講の講義にはカテゴリを表示しない
      for (const categoryId of lecture.categoryIds) {
        const path = categoryPathMap.get(categoryId);
        if (path && path.length > bestPath.length) {
          bestPath = path;
        }
      }

      if (bestPath.length > 0) {
        isRequired = [...lecture.courseIds].some((cid) =>
          requiredCourseIds.has(cid)
        );
        if (!isRequired) {
          for (const [orgCatKey, mins] of minCreditsOfOrgCategory) {
            const [reqOrg, categoryId] = orgCatKey.split("|");
            if (!reqOrg || !categoryId) continue;
            if (!orgIdSet.has(reqOrg)) continue;
            if (!lecture.categoryIds.has(categoryId)) continue;
            const total = creditSumOfUserOrgs(
              categoryId,
              orgIdSet,
              coursesOfOrgCategory,
              creditOfCourse
            );
            if (mins.some((min) => min === total)) {
              isRequired = true;
              break;
            }
          }
        }
        category = {
          orgName: lecture.orgName,
          categoryNames: bestPath,
          isRequired
        };
      }
    }

    return {
      id,
      title: lecture.name,
      timeTableCode: lecture.timeTableCode,
      term: lecture.term,
      period: lecture.period,
      targetGrades: lecture.targetGrades,
      instructors: lecture.instructors,
      courseIds: [...lecture.courseIds],
      category,
      belongsToUserOrg
    };
  });
}

export async function resolveOrgIds(fragments: string[]): Promise<string[]> {
  if (fragments.length === 0) return [];
  const { orgDataMap } = await getMasterData();
  const ids: string[] = [];
  for (const [id, data] of orgDataMap) {
    if (fragments.some((f) => data.name.includes(f))) {
      ids.push(id);
    }
  }
  return ids;
}

export async function expandOrgDescendants(
  orgIds: string[]
): Promise<string[]> {
  if (orgIds.length === 0) return [];
  const { orgDataMap } = await getMasterData();

  const descendants = new Set<string>();
  const visit = (id: string) => {
    if (descendants.has(id)) return;
    descendants.add(id);
    for (const [childId, data] of orgDataMap) {
      if (data.parent === id) {
        visit(childId);
      }
    }
  };

  for (const id of orgIds) {
    visit(id);
  }

  return Array.from(descendants);
}

export async function getRequiredCourseIds(): Promise<Set<string>> {
  const { requiredCourseIds } = await getMasterData();
  return requiredCourseIds;
}
