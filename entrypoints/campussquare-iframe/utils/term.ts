export function toSparqlTerms(term: string): string[] {
  switch (term) {
    case "春":
      return ["前学期", "春ターム", "前学期集中"];
    case "夏":
      return ["前学期", "夏ターム"];
    case "秋":
      return ["後学期", "秋ターム", "後学期集中"];
    case "冬":
      return ["後学期", "冬ターム"];
    case "他":
      return ["集中", "その他"];
    default:
      return [term];
  }
}
