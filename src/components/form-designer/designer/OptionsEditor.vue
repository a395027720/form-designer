<script setup lang="ts">
/**
 * 选项列表编辑器：用于 Select / RadioGroup / CheckboxGroup
 * - props.options 传入可作为初始数据
 * - 用户增删改通过 emit('update:options') 传出
 * 数据形态：{ label: string, value: string | number }[]
 */
import { ref, watch } from 'vue'
import type { SelectOption } from '../types'

interface Props {
  options: SelectOption[]
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:options', value: SelectOption[]): void
}>()

// 本地草稿,避免每个键击都向上 emit
const draft = ref<SelectOption[]>([])

function syncFromProps() {
  draft.value = (props.options ?? []).map(o => ({ label: String(o.label), value: o.value }))
}

watch(() => props.options, () => {
  // 外部整体替换时才同步,避免覆盖用户正在编辑的草稿
  if (props.options.length !== draft.value.length) syncFromProps()
}, { immediate: true })

function commit() {
  emit('update:options', draft.value.map(o => ({ label: o.label, value: o.value })))
}

function add() {
  const idx = draft.value.length + 1
  draft.value.push({ label: `选项${idx}`, value: '' })
  commit()
}

function remove(i: number) {
  draft.value.splice(i, 1)
  commit()
}

function moveUp(i: number) {
  if (i <= 0) return
  const item = draft.value.splice(i, 1)[0]
  draft.value.splice(i - 1, 0, item)
  commit()
}

function moveDown(i: number) {
  if (i >= draft.value.length - 1) return
  const item = draft.value.splice(i, 1)[0]
  draft.value.splice(i + 1, 0, item)
  commit()
}

function onLabelEdit(i: number, v: string) {
  draft.value[i].label = v
  commit()
}

function onValueEdit(i: number, v: string) {
  draft.value[i].value = v
  commit()
}

// 注：原 setAsDefault/emit('set-default') 与更新选项语义重复，已移除（同一时刻只保留一种交互）
</script>

<template>
  <div class="pp-options-editor">
    <div v-if="draft.length" class="pp-options-list">
      <div
        v-for="(opt, i) in draft"
        :key="i"
        class="pp-option-row"
      >
        <span class="pp-option-index">{{ i + 1 }}</span>
        <a-input
          class="pp-option-input"
          :value="opt.label"
          :disabled="disabled"
          placeholder="显示文本 (label)"
          size="small"
          @update:value="(v: any) => onLabelEdit(i, v)"
        />
        <a-input
          class="pp-option-input pp-option-input-value"
          :value="opt.value"
          :disabled="disabled"
          placeholder="值"
          size="small"
          @update:value="(v: any) => onValueEdit(i, v)"
        />
        <div v-if="!disabled" class="pp-option-actions">
          <a-button size="small" :disabled="i === 0" title="上移" @click="moveUp(i)">↑</a-button>
          <a-button size="small" :disabled="i === draft.length - 1" title="下移" @click="moveDown(i)">↓</a-button>
          <a-button size="small" danger title="删除" @click="remove(i)">×</a-button>
        </div>
      </div>
    </div>

    <div v-else class="pp-options-empty">
      暂无选项{{ disabled ? '' : '，点击下方添加' }}
    </div>

    <a-button v-if="!disabled" block @click="add">+ 添加选项</a-button>
  </div>
</template>

<style scoped>
.pp-options-editor {
  width: 100%;
}
.pp-options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.pp-option-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pp-option-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 3px;
  flex-shrink: 0;
}
.pp-option-input {
  flex: 1;
  min-width: 0;
}
.pp-option-input-value {
  max-width: 100px;
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.pp-option-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.pp-options-empty {
  padding: 12px 8px;
  margin-bottom: 8px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  border: 1px dashed #cbd5e0;
  border-radius: 4px;
  background: #f8fafc;
}
</style>