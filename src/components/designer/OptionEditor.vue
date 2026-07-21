<template>
  <div class="option-editor">
    <div v-for="(opt, i) in value" :key="i" class="option-row">
      <a-input v-model:value="opt.label" placeholder="显示文本" size="small" />
      <a-input v-model:value="opt.value" placeholder="值" size="small" />
      <a-button size="small" type="text" danger @click="remove(i)">✕</a-button>
    </div>
    <a-button size="small" block @click="add">+ 添加选项</a-button>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from '@/types/template'

const value = defineModel<SelectOption[]>('value', { required: true })

const add = () => {
  value.value.push({ label: '新选项', value: 'new_' + Date.now() })
}
const remove = (i: number) => {
  value.value.splice(i, 1)
}
</script>

<style scoped>
.option-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.option-row > * {
  flex: 1;
}
</style>