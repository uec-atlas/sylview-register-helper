import { useEventListener } from "@vueuse/core";
import { CAMPUSWEB_ORIGIN } from "@/lib/constants";
import {
  expandOrgDescendants,
  fetchSyllabusCards,
  resolveOrgIds,
  type SyllabusCard
} from "@/lib/sparql";
import type {
  MessagePayload,
  RequestInfoMessage,
  RequestInputCodeMessage,
  RequestOpenSyllabusMessage
} from "@/types/message";
import type { Query } from "@/types/query";
import { sortSyllabuses } from "../utils/syllabus";
import { toSparqlTerms } from "../utils/term";

function buildQueryFromDepartment(department: string): {
  orgNames: string[];
  hasProgram: boolean;
} {
  // 所属 → Atlas組織名のマッピング
  const departmentMatch = department.match(/情報理工学域([ⅠⅡⅢ])類(.+)/);
  if (departmentMatch) {
    const programName = `${departmentMatch[2]}プログラム`;
    const clusterName = `${departmentMatch[1]}類`;
    return { orgNames: [clusterName, programName], hasProgram: true };
  }
  if (department.includes("先端工学基礎課程")) {
    return { orgNames: ["先端工学基礎課程"], hasProgram: false };
  }
  return { orgNames: [], hasProgram: false };
}

export function useSyllabusSearch() {
  const query = ref<Query>({
    grade: 1,
    term: "",
    year: 0,
    orgNames: [],
    period: ""
  });
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const syllabuses = ref<SyllabusCard[]>([]);

  async function loadSyllabuses(q: Query) {
    if (!q.period || !q.term) return;
    loading.value = true;
    error.value = null;

    try {
      const orgIds = await resolveOrgIds(q.orgNames);
      // プログラム名が取れていない場合(=配属前)は類IDから子孫プログラムも展開
      const hasProgram = q.orgNames.some((n) => n.includes("プログラム"));
      const expandedOrgIds = hasProgram
        ? orgIds
        : [...orgIds, ...(await expandOrgDescendants(orgIds))];
      const cards = await fetchSyllabusCards({
        periods: [q.period],
        terms: toSparqlTerms(q.term),
        year: q.year,
        orgIds: expandedOrgIds
      });
      syllabuses.value = cards.toSorted(sortSyllabuses);
    } catch (e) {
      console.error("Failed to fetch syllabus cards:", e);
      error.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      loading.value = false;
    }
  }

  const listener = (event: MessageEvent<MessagePayload>) => {
    if (event.origin !== CAMPUSWEB_ORIGIN) return;
    const { type, data } = event.data;
    if (type !== "responseInfo") return;

    const { orgNames } = buildQueryFromDepartment(data.department);
    const newQuery: Query = {
      grade: data.grade,
      term: data.term,
      year: data.year,
      orgNames,
      period: data.period
    };
    query.value = newQuery;
    loadSyllabuses(newQuery);
  };
  useEventListener(window, "message", listener);

  const openSyllabus = (timeTableCode: string) => {
    window.parent.postMessage(
      {
        type: "requestOpenSyllabus",
        data: { timeTableCode }
      } satisfies RequestOpenSyllabusMessage,
      CAMPUSWEB_ORIGIN
    );
  };

  const inputTimeTableCode = (timeTableCode: string) => {
    window.parent.postMessage(
      {
        type: "requestInputCode",
        data: { timeTableCode }
      } satisfies RequestInputCodeMessage,
      CAMPUSWEB_ORIGIN
    );
  };

  const requestInfo = () => {
    window.parent.postMessage(
      { type: "requestInfo" } satisfies RequestInfoMessage,
      CAMPUSWEB_ORIGIN
    );
  };

  return {
    query,
    loading,
    error,
    syllabuses,
    openSyllabus,
    inputTimeTableCode,
    requestInfo
  };
}
