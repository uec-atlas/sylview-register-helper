<script setup lang="ts">
import logo from "../assets/logo.svg";

const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="sticky top-0 bg-white z-10 border-b border-b-gray-200">
    <header class="flex flex-row items-center justify-between p-2">
      <h1 class="text-primary-600 text-xl font-bold">時間割コード検索</h1>
      <a
        href="https://uec-atlas.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img alt="UEC Atlas" :src="logo" class="h-8" />
      </a>
    </header>
    <section class="flex flex-col gap-1 px-2 py-1">
      <label for="search" class="text-xs font-medium text-gray-600">科目名・教員名</label>
      <input
        id="search"
        v-model="model"
        type="search"
        class="w-full border-2 border-gray-300 bg-white px-2 py-1 focus:border-primary-500 focus:outline-none"
      />
    </section>
    <p class="text-xs text-gray-600 px-2 py-1">
      ※実際の科目区分や必修・選択の別は<a href="https://kyoumu.office.uec.ac.jp/youran/youran.html" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80">学修要覧</a>を参照してください。
    </p>
  </div>
</template>
