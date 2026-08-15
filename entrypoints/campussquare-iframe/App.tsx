import { onMounted } from "vue";
import SearchBar from "./components/SearchBar.vue";
import SyllabusList from "./components/SyllabusList.vue";
import { useLocalSearch } from "./composables/useLocalSearch";
import { useSyllabusSearch } from "./composables/useSyllabusSearch";

export const App = defineComponent({
  setup() {
    const {
      loading,
      error,
      syllabuses,
      openSyllabus,
      inputTimeTableCode,
      requestInfo
    } = useSyllabusSearch();
    const { localSearchQuery, filteredSyllabuses } = useLocalSearch(syllabuses);

    onMounted(requestInfo);

    return () => (
      <div>
        <SearchBar
          modelValue={localSearchQuery.value}
          onUpdate:modelValue={(value: string) => {
            localSearchQuery.value = value;
          }}
        />
        <SyllabusList
          items={filteredSyllabuses.value}
          loading={loading.value}
          error={error.value}
          onOpenSyllabus={openSyllabus}
          onInputTimeTableCode={inputTimeTableCode}
        />
      </div>
    );
  }
});
