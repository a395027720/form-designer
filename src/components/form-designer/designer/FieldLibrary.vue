<script setup lang="ts">
import { COMPONENT_LIBRARY, COMPONENT_GROUP_ORDER } from '@/types/antd-mapping'
import type { BasicComponentType as ComponentType } from '../types'
import type { BasicComponentType } from '../types'
import { computed } from 'vue'

interface Props {
  modelValue: BasicComponentType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: BasicComponentType): void
}>()

const ICONS: Record<string, string> = {
  Input: 'Aa', Textarea: '¶', InputNumber: '#', Select: '▼',
  RadioGroup: '◉', CheckboxGroup: '☑', DatePicker: '📅',
  TimePicker: '⏱', Switch: '◐', DisplayText: '👁'
}
const iconChar = (t: ComponentType) => ICONS[t] || '◇'

const groups = computed(() =>
  COMPONENT_GROUP_ORDER.map(name => ({
    name,
    items: COMPONENT_LIBRARY.filter(i => i.group === name)
  })).filter(g => g.items.length > 0)
)

function select(type: BasicComponentType) {
  emit('update:modelValue', type)
}
</script>

<template>
  <div class="component-library">
    <div class="library-header">
      <h3>组件库</h3>
      <p class="text-muted">点击切换组件类型</p>
    </div>
    <div class="library-body">
      <div v-for="group in groups" :key="group.name" class="library-group">
        <div class="library-group-title">{{ group.name }}</div>
        <div class="library-list">
          <div
            v-for="item in group.items"
            :key="item.type"
            class="library-item"
            :class="{ 'library-item-selected': modelValue === item.type }"
            @click="select(item.type as BasicComponentType)"
          >
            <div class="library-icon" :class="`type-${item.type.toLowerCase()}`">
              {{ iconChar(item.type) }}
            </div>
            <div class="library-info">
              <div class="label">{{ item.label }}</div>
              <div class="text-muted desc">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-library {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}
.library-header {
  height: 48px;
  box-sizing: border-box;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.library-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}
.library-header p {
  margin: 1px 0 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.2;
}
.library-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.library-group-title {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.library-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 12px 12px;
}
.library-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.library-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}
.library-item-selected {
  background: #eff6ff;
  border-color: #93c5fd;
}
.library-icon {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.library-icon.type-input { background: #dbeafe; color: #1d4ed8; }
.library-icon.type-inputnumber { background: #ecfeff; color: #0891b2; }
.library-icon.type-textarea { background: #ede9fe; color: #6d28d9; }
.library-icon.type-select,
.library-icon.type-radiogroup,
.library-icon.type-checkboxgroup { background: #fef3c7; color: #b45309; }
.library-icon.type-datepicker,
.library-icon.type-timepicker { background: #ede9fe; color: #6d28d9; }
.library-icon.type-switch { background: #fce7f3; color: #be185d; }
.library-icon.type-displaytext { background: #d1fae5; color: #047857; }
.library-info {
  flex: 1;
  min-width: 0;
}
.library-info .label {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}
.library-info .desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 1px;
  line-height: 1.3;
}
</style>
