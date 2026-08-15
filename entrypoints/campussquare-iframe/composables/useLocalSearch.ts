import type { SyllabusCard } from "@/lib/sparql";

export function useLocalSearch(syllabuses: Ref<SyllabusCard[]>) {
  const localSearchQuery = ref("");

  const filteredSyllabuses = computed(() => {
    const keywords = localSearchQuery.value.toLowerCase().split(/\s+/);
    if (keywords.length === 0 || keywords[0] === "") return syllabuses.value;
    return syllabuses.value.filter((s) =>
      keywords.every(
        (q) =>
          s.title.toLowerCase().includes(q) ||
          s.instructors.some((i) => i.toLowerCase().includes(q))
      )
    );
  });

  return { localSearchQuery, filteredSyllabuses };
}
