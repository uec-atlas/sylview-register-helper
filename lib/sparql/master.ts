import { STORAGE_KEY_PREFIX } from "@/lib/constants";
import { query } from "./client";
import { buildCourseCreditsQuery, buildMasterDataQuery } from "./queries";

export interface OrgData {
  name: string;
  parent: string | null;
}

export interface MasterData {
  orgDataMap: Map<string, OrgData>;
  categoryPathMap: Map<string, string[]>;
  requiredCourseIds: Set<string>;
  // カテゴリ構成コースの単位総和計算に使う course → 単位
  creditOfCourse: Map<string, number>;
}

const MASTER_CACHE_KEY = `${STORAGE_KEY_PREFIX}masterData`;

let masterDataCache: Promise<MasterData> | null = null;

// マスターデータはほぼ静的で、iframe を開くたびに再取得すると数百 ms 無駄になるため
// sessionStorage にキャッシュしてセッション内の再取得を避ける。
export function getMasterData(): Promise<MasterData> {
  if (!masterDataCache) masterDataCache = loadMasterData();
  return masterDataCache;
}

async function loadMasterData(): Promise<MasterData> {
  const cached = sessionStorage.getItem(MASTER_CACHE_KEY);
  if (cached) {
    try {
      return deserializeMasterData(JSON.parse(cached));
    } catch {
      sessionStorage.removeItem(MASTER_CACHE_KEY);
    }
  }

  const data = await buildMasterData();
  sessionStorage.setItem(
    MASTER_CACHE_KEY,
    JSON.stringify(serializeMasterData(data))
  );
  return data;
}

type SerializedMasterData = {
  orgDataMap: [string, OrgData][];
  categoryPathMap: [string, string[]][];
  requiredCourseIds: string[];
  creditOfCourse: [string, number][];
};

function serializeMasterData(data: MasterData): SerializedMasterData {
  return {
    orgDataMap: [...data.orgDataMap],
    categoryPathMap: [...data.categoryPathMap],
    requiredCourseIds: [...data.requiredCourseIds],
    creditOfCourse: [...data.creditOfCourse]
  };
}

function deserializeMasterData(raw: SerializedMasterData): MasterData {
  return {
    orgDataMap: new Map(raw.orgDataMap),
    categoryPathMap: new Map(raw.categoryPathMap),
    requiredCourseIds: new Set(raw.requiredCourseIds),
    creditOfCourse: new Map(raw.creditOfCourse)
  };
}

async function buildMasterData(): Promise<MasterData> {
  const [result, courseCredits] = await Promise.all([
    query(buildMasterDataQuery()),
    query(buildCourseCreditsQuery())
  ]);

  const orgDataMap = new Map<string, OrgData>();
  const categoryParentOf = new Map<string, string | null>();
  const categoryNameOf = new Map<string, string>();
  const requiredCourseIds = new Set<string>();
  const creditOfCourse = new Map<string, number>();

  for (const b of result.results.bindings) {
    const type = b.type?.value;
    if (type === "org") {
      const id = b.id?.value;
      const name = b.orgName?.value;
      if (id && name) {
        orgDataMap.set(id, { name, parent: b.parent?.value ?? null });
      }
    } else if (type === "cat") {
      const id = b.id?.value;
      if (!id) continue;
      categoryParentOf.set(id, b.parent?.value ?? null);
      const nm = b.catName?.value;
      if (nm) categoryNameOf.set(id, nm);
    } else if (type === "required") {
      const course = b.requiredCourse?.value;
      if (course) requiredCourseIds.add(course);
    }
  }

  for (const b of courseCredits.results.bindings) {
    const course = b.course?.value;
    const credits = Number(b.credits?.value ?? 0);
    if (course) creditOfCourse.set(course, credits);
  }

  const categoryPathMap = new Map<string, string[]>();
  for (const [id] of categoryNameOf) {
    const chain: string[] = [];
    let cur: string | null = id;
    while (cur) {
      chain.push(cur);
      cur = categoryParentOf.get(cur) ?? null;
    }
    chain.reverse();
    const path = chain
      .map((cid) => categoryNameOf.get(cid))
      .filter(Boolean) as string[];
    if (path.length > 0) categoryPathMap.set(id, path);
  }

  return {
    orgDataMap,
    categoryPathMap,
    requiredCourseIds,
    creditOfCourse
  };
}
