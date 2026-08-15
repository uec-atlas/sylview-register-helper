<script setup lang="ts">
import type { SyllabusCard } from "@/lib/sparql";
import SyllabusCardItem from "./SyllabusCardItem.vue";

defineProps<{
  items: SyllabusCard[];
  loading: boolean;
  error: Error | null;
}>();

const emit = defineEmits<{
  openSyllabus: [timeTableCode: string];
  inputTimeTableCode: [timeTableCode: string];
}>();

const onOpenSyllabus = (timeTableCode: string) =>
  emit("openSyllabus", timeTableCode);
const onInputTimeTableCode = (timeTableCode: string) =>
  emit("inputTimeTableCode", timeTableCode);
</script>

<template>
  <div class="mt-2">
    <div
      v-if="error"
      class="mx-2 my-2 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      科目一覧の取得に失敗しました。
    </div>
    <div
      v-else-if="!loading && items.length === 0"
      class="mx-2 my-2 border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
    >
      条件に該当する科目が見つかりませんでした。
    </div>
    <div class="flex flex-col gap-2">
      <template v-for="(item, i) in items" :key="item.id">
        <SyllabusCardItem
          :item="item"
          @open-syllabus="onOpenSyllabus"
          @input-time-table-code="onInputTimeTableCode"
        />
        <div v-if="i < items.length - 1" class="border-t border-gray-200" />
      </template>
    </div>
    <div v-if="loading" class="my-4 flex justify-center">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
      />
    </div>
  </div>
</template>
