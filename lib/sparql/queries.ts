const quote = (val: string): string => `"${val}"`;
const iri = (val: string): string => `<${val}>`;

export function buildMasterDataQuery(): string {
  return `
PREFIX schema: <http://schema.org/>
PREFIX uao: <https://uec-atlas.org/ontology/>
PREFIX org: <http://www.w3.org/ns/org#>

SELECT DISTINCT ?type ?id ?orgName ?catName ?parent ?requiredCourse WHERE {
  {
    BIND("org" AS ?type)
    ?org a uao:Organization .
    BIND(?org AS ?id)
    ?org schema:name ?orgName .
    FILTER(LANG(?orgName) = "ja")
    OPTIONAL { ?org org:subOrganizationOf ?parent }
  }
  UNION
  {
    BIND("cat" AS ?type)
    ?cat a uao:CourseCategory .
    BIND(?cat AS ?id)
    ?cat schema:name ?catName .
    FILTER(LANG(?catName) = "ja")
    OPTIONAL { ?cat uao:subCategoryOf ?parent }
  }
  UNION
  {
    BIND("required" AS ?type)
    ?checkpoint a uao:Checkpoint ;
      uao:courseRequirement ?requiredCourse .
  }
}`;
}

export function buildCategoryMappingQuery(orgIds: string[]): string {
  return `
PREFIX schema: <http://schema.org/>
PREFIX uao: <https://uec-atlas.org/ontology/>

SELECT DISTINCT ?org ?categoryId ?course WHERE {
  VALUES ?org { ${orgIds.map(iri).join(" ")} }
  ?mapping a uao:CourseCategoryMapping ;
    uao:targetOrganization ?org ;
    uao:category ?categoryId ;
    uao:course ?course .
}`;
}

export function buildCategoryRequirementQuery(orgIds: string[]): string {
  return `
PREFIX schema: <http://schema.org/>
PREFIX uao: <https://uec-atlas.org/ontology/>

SELECT DISTINCT ?org ?categoryId ?minCredits WHERE {
  VALUES ?org { ${orgIds.map(iri).join(" ")} }
  ?checkpoint a uao:Checkpoint ;
    uao:targetOrganization ?org ;
    uao:categoryRequirement ?requirement .
  ?requirement uao:targetCategory ?categoryId ;
    uao:minCredits ?minCredits .
}`;
}

export function buildCourseCreditsQuery(): string {
  return `
PREFIX schema: <http://schema.org/>
PREFIX uao: <https://uec-atlas.org/ontology/>

SELECT DISTINCT ?course ?credits WHERE {
  ?course a uao:Course ; schema:numberOfCredits ?credits .
}`;
}

export interface SyllabusCardsQueryParams {
  periods: string[];
  terms: string[];
  year: number;
}

export function buildLecturesQuery(params: SyllabusCardsQueryParams): string {
  return `
PREFIX schema: <http://schema.org/>
PREFIX uao: <https://uec-atlas.org/ontology/>

SELECT ?lecture ?name ?timetableCode ?course
  (GROUP_CONCAT(DISTINCT ?grade; SEPARATOR=",") AS ?grades)
  (GROUP_CONCAT(DISTINCT ?instructorName; SEPARATOR=",") AS ?instructorNames)
WHERE {
  VALUES ?period { ${params.periods.map(quote).join(" ")} }
  VALUES ?term { ${params.terms.map(quote).join(" ")} }

  ?lecture a uao:Lecture ;
    uao:period ?period ;
    uao:term ?term ;
    uao:timeTableCode ?timetableCode ;
    uao:year ${params.year} ;
    schema:name ?name ;
    uao:targetGrade ?grade ;
    uao:course ?course .

  OPTIONAL {
    ?lecture schema:instructor ?instructor .
    ?instructor schema:name ?instructorName .
    FILTER(LANG(?instructorName) = "ja")
  }

  FILTER(LANG(?name) = "ja")
}
GROUP BY ?lecture ?name ?timetableCode ?course`;
}

export function buildCourseInfoQuery(courses: string[]): string {
  return `
PREFIX schema: <http://schema.org/>
PREFIX uao: <https://uec-atlas.org/ontology/>

SELECT DISTINCT ?course ?org ?orgName ?mappingOrg ?categoryId WHERE {
  VALUES ?course { ${courses.map(iri).join(" ")} }

  OPTIONAL {
    ?course uao:organization ?org .
    OPTIONAL { ?org schema:name ?orgName . FILTER(LANG(?orgName) = "ja") }
  }

  OPTIONAL {
    ?mapping a uao:CourseCategoryMapping ;
      uao:course ?course ;
      uao:targetOrganization ?mappingOrg ;
      uao:category ?categoryId .
  }
}`;
}
