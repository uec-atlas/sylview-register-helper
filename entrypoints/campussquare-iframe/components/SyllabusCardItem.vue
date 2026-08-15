<script setup lang="ts">
import type { SyllabusCard } from "@/lib/sparql";
import { getCategoryInfo } from "../utils/category";

const props = defineProps<{
  item: SyllabusCard;
}>();

const emit = defineEmits<{
  openSyllabus: [timeTableCode: string];
  inputTimeTableCode: [timeTableCode: string];
}>();

const categoryInfo = () => getCategoryInfo(props.item);
</script>

<template>
  <div class="flex flex-col gap-3 px-4 py-2">
    <div class="flex flex-col gap-1">
      <div class="flex flex-row items-center gap-2">
        <div v-if="categoryInfo()">
          <span
            v-if="categoryInfo()?.isRequired"
            class="flex-none bg-orange-600 px-1.5 py-0.5 text-xs font-medium text-white"
          >
            必修
          </span>
          <span
            v-else
            class="flex-none bg-cyan-600 px-1.5 py-0.5 text-xs font-medium text-white"
          >
            選択必修/選択
          </span>
        </div>
        <p class="text-xs">{{ item.timeTableCode }}</p>
      </div>
      <h2 class="text-lg">{{ item.title }}</h2>
      <p class="text-sm">{{ item.instructors.join(", ") }}</p>
    </div>
    <div v-if="categoryInfo()" class="flex flex-col gap-1">
      <div class="flex flex-row flex-wrap items-center gap-2">
        <div class="flex flex-row flex-wrap text-sm">
          <span
            v-for="(categoryName, index) in categoryInfo()?.categoryNames ?? []"
            :key="index"
            class="mr-1.5"
          >
            {{ categoryName }}
            <span v-if="index < (categoryInfo()?.categoryNames?.length ?? 0) - 1">/</span>
          </span>
        </div>
      </div>
    </div>
    <div class="flex flex-row justify-end gap-2">
      <button
        type="button"
        class="border border-gray-300 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
        @click="emit('openSyllabus', item.timeTableCode ?? '')"
      >
        シラバスを参照
      </button>
      <button
        type="button"
        class="bg-primary-600 px-2.5 py-1 text-sm font-medium text-white hover:bg-primary-800 cursor-pointer"
        @click="emit('inputTimeTableCode', item.timeTableCode ?? '')"
      >
        時間割コードを入力
      </button>
    </div>
  </div>
</template>
