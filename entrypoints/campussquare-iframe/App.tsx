import {
  Breadcrumb,
  Button,
  Divider,
  IftaLabel,
  InputText,
  Message,
  ProgressSpinner,
  Tag
} from "primevue";
import type {
  MessagePayload,
  RequestInfoMessage,
  RequestInputCodeMessage,
  RequestOpenSyllabusMessage
} from "@/types/message";
import logo from "./assets/logo.svg";
import { useQuery } from "@urql/vue";
import { graphql } from "@/types/__generated__";
import type { Syllabus, SyllabusesQuery } from "@/types/__generated__/graphql";
import { getCategoryInfo } from "./utils/category";
import { useInfiniteScroll } from "@vueuse/core";
import { sortSyllabuses } from "./utils/syllabus";

const syllabusQuery = graphql(`
  query Syllabuses(
    $after: String
    $grades: [Int!]
    $semester: [String!]
    $period: String!
  ) {
    syllabuses(
      first: 50
      after: $after
      filter: {
        grades: { hasSome: $grades }
        periods: { equals: $period }
        semester: { in: $semester }
      }
    ) {
      edges {
        cursor
        node {
          id
          title
          timeTableCode
          grades
          lecturers
          creditCategories {
            category {
              id
              name
              parent {
                id
                name
                parent {
                  id
                  name
                  parent {
                    id
                    name
                  }
                }
              }
            }
            department {
              id
              name
            }
            isRequired
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export type Query = {
  grade: number;
  semester: string;
  term: string;
  departmentNames: string[];
  period: string;
};

export const App = defineAsyncComponent(async () => {
  const query = ref<Query>({
    grade: 1,
    semester: "",
    term: "",
    departmentNames: [],
    period: ""
  });

  const endCursor = ref<string>();
  const syllabusesQueryVariables = computed(() => {
    const semesterValue = [query.value.semester];
    if (query.value.semester !== "他") {
      semesterValue.push(`${query.value.term}ターム`);
      if (query.value.term === "春" || query.value.term === "秋") {
        semesterValue.push(`${query.value.semester}集中`);
      }
    }
    return {
      semester: semesterValue,
      period: query.value.period,
      grades: Array.from({ length: query.value.grade }, (_, i) => i + 1),
      after: endCursor.value
    };
  });

  const syllabusesQuery = useQuery<SyllabusesQuery>({
    query: syllabusQuery,
    variables: syllabusesQueryVariables,
    pause: computed(
      () => query.value.semester === "" || query.value.period === ""
    )
  });

  const localSearchQuery = ref("");

  const syllabuses = computed<Syllabus[]>(
    () =>
      syllabusesQuery.data.value?.syllabuses?.edges
        ?.map((e) => e?.node)
        .filter<Syllabus>((v) => !!v)
        .filter((s) => {
          if (!localSearchQuery.value) return true;
          const keywords = localSearchQuery.value.toLowerCase().split(/\s+/);
          if (keywords.length === 0) return true;
          return keywords.every(
            (q) =>
              s.title?.toLowerCase().includes(q) ||
              s.lecturers?.toLowerCase().includes(q)
          );
        })
        .toSorted(sortSyllabuses(query.value)) ?? []
  );

  const listener = (event: MessageEvent<MessagePayload>) => {
    if (event.origin !== "https://campusweb.office.uec.ac.jp") {
      return;
    }
    const { type, data } = event.data;
    switch (type) {
      case "responseInfo": {
        const newQuery: Query = {
          grade: data.grade,
          semester: "",
          term: data.term,
          departmentNames: [],
          period: data.period
        };
        if (data.term === "春" || data.term === "夏")
          newQuery.semester = "前学期";
        else if (data.term === "秋" || data.term === "冬")
          newQuery.semester = "後学期";
        newQuery.departmentNames = [];
        const departmentMatch =
          data.department.match(/情報理工学域([ⅠⅡⅢ])類(.+)/);
        if (departmentMatch) {
          const departmentKey =
            { Ⅰ: "I類 (情報系)", Ⅱ: "II類 (融合系)", Ⅲ: "III類 (理工系)" }[
              departmentMatch[1]
            ] ?? "";
          newQuery.departmentNames.push(departmentKey, "昼間コース");
          if (departmentMatch.length >= 3)
            newQuery.departmentNames.push(`${departmentMatch[2]}プログラム`);
        } else if (data.department.includes("先端工学基礎課程")) {
          newQuery.departmentNames.push("夜間コース", "先端工学基礎課程");
        }
        query.value = newQuery;
        window.removeEventListener("message", listener);
        break;
      }
    }
  };
  window.addEventListener("message", listener);

  const openSyllabus = (timeTableCode: string) => {
    window.parent.postMessage(
      {
        type: "requestOpenSyllabus",
        data: { timeTableCode }
      } as RequestOpenSyllabusMessage,
      "https://campusweb.office.uec.ac.jp"
    );
  };

  const inputTimeTableCode = (timeTableCode: string) => {
    window.parent.postMessage(
      {
        type: "requestInputCode",
        data: {
          timeTableCode
        }
      } as RequestInputCodeMessage,
      "https://campusweb.office.uec.ac.jp"
    );
  };

  onMounted(() => {
    window.parent.postMessage(
      { type: "requestInfo" } as RequestInfoMessage,
      "https://campusweb.office.uec.ac.jp"
    );
  });

  useInfiniteScroll(
    window,
    () => {
      if (syllabusesQuery.data.value?.syllabuses?.pageInfo.endCursor) {
        endCursor.value =
          syllabusesQuery.data.value?.syllabuses.pageInfo.endCursor;
      }
    },
    {
      distance: 10,
      canLoadMore: () =>
        (syllabusesQuery.data.value?.syllabuses?.pageInfo.hasNextPage &&
          !syllabusesQuery.fetching.value) ??
        false
    }
  );

  return () => (
    <div>
      <div class="sticky top-0 bg-white z-10 border-b border-b-gray-200">
        <header class="flex flex-row align-center justify-between p-2 ">
          <h1 class="text-primary-600 text-xl font-bold">時間割コード検索</h1>
          <a
            href="https://sylview.e-chan.me/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img alt="UEC SylView" src={logo} class="h-8" />
          </a>
        </header>
        <section class="p-2">
          <IftaLabel>
            <InputText
              v-model={localSearchQuery}
              id="search"
              type="search"
              fluid
              size="small"
            />
            <label for="search">科目名・教員名</label>
          </IftaLabel>
        </section>
      </div>
      {syllabusesQuery.error.value && (
        <Message severity="error" class="mx-2">
          科目一覧の取得に失敗しました。
        </Message>
      )}
      {!syllabusesQuery.error.value &&
        !syllabusesQuery.fetching.value &&
        syllabuses.value.length === 0 && (
          <Message class="mx-2">
            条件に該当する科目が見つかりませんでした。
          </Message>
        )}
      <div class="flex flex-col gap-2">
        {syllabuses.value.map((item, i) => {
          const categoryInfo = getCategoryInfo(item, query.value);
          return (
            <>
              <div class="px-4 py-2 flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                  <p class="text-xs">{item.timeTableCode}</p>
                  <h2 class="text-lg">{item.title}</h2>
                  <p class="text-sm">{item.lecturers}</p>
                </div>
                {categoryInfo && (
                  <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2 items-center">
                      {categoryInfo?.isRequired ? (
                        <Tag value="必修" severity="danger" class="flex-none" />
                      ) : (
                        <Tag
                          value="選択必修/選択"
                          severity="info"
                          class="flex-none"
                        />
                      )}
                      <Breadcrumb
                        model={categoryInfo.categoryNames.map((v) => ({
                          label: v
                        }))}
                        class="!p-0 !m-0"
                        pt={{ list: { class: "!flex-wrap" } }}
                      >
                        {{
                          item: ({ label }: { label: string }) => (
                            <span class="text-sm">{label}</span>
                          )
                        }}
                      </Breadcrumb>
                    </div>
                  </div>
                )}
                <div class="flex flex-row justify-end gap-2">
                  <Button
                    raised
                    size="small"
                    severity="secondary"
                    onClick={() => openSyllabus(item.timeTableCode ?? "")}
                  >
                    シラバスを参照
                  </Button>
                  <Button
                    raised
                    size="small"
                    onClick={() => inputTimeTableCode(item.timeTableCode ?? "")}
                  >
                    時間割コードを入力
                  </Button>
                </div>
              </div>
              {i < syllabuses.value.length - 1 && <Divider class="!m-0" />}
            </>
          );
        })}
      </div>
      {syllabusesQuery.fetching.value && (
        <div class="flex justify-center my-4">
          <ProgressSpinner />
        </div>
      )}
    </div>
  );
});
