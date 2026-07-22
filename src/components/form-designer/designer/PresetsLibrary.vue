<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Sortable from 'sortablejs'
import type { ComponentDef } from '../types'

interface Props {
  presets: ComponentDef[]
  /** 自定义搜索函数，默认按 label/field 模糊匹配 */
  searchFn?: (item: ComponentDef, keyword: string) => boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'add', component: ComponentDef): void
}>()

const search = ref('')

const defaultSearch = (item: ComponentDef, kw: string) =>
  item.label.includes(kw) || item.field.toLowerCase().includes(kw)

const filteredPresets = computed(() => {
  const kw = search.value.trim().toLowerCase()
  if (!kw) return props.presets
  const fn = props.searchFn || defaultSearch
  return props.presets.filter(p => fn(p, kw))
})

// 按分类分组平铺（用于渲染）
const groupedList = computed(() => {
  const cats: string[] = []
  const map: Record<string, ComponentDef[]> = {}
  for (const p of filteredPresets.value) {
    const cat = (p.props as any)?.categoryLabel || '其他'
    if (!map[cat]) { map[cat] = []; cats.push(cat) }
    map[cat].push(p)
  }
  const flat: Array<{ type: 'group'; name: string; count: number } | { type: 'item'; data: ComponentDef }> = []
  for (const cat of cats) {
    flat.push({ type: 'group', name: cat, count: map[cat].length })
    for (const p of map[cat]) flat.push({ type: 'item', data: p })
  }
  return flat
})

// SortableJS
const listRef = ref<HTMLElement | null>(null)
let sortable: Sortable | null = null

function initSortable() {
  if (!listRef.value) return
  if (sortable) sortable.destroy()
  sortable = Sortable.create(listRef.value, {
    group: { name: 'components', pull: 'clone', put: false },
    animation: 150,
    sort: false,
    filter: '.fd-lib-group-title',
    draggable: '.fd-lib-item',
    ghostClass: 'vf-canvas-ghost',
    chosenClass: 'vf-chosen',
    dragClass: 'vf-drag'
  })
}

onMounted(() => nextTick(() => initSortable()))
onBeforeUnmount(() => sortable?.destroy())
watch(() => filteredPresets.value, () => nextTick(() => initSortable()), { deep: true })

const TYPE_COLORS: Record<string, string> = {
  Input: '#3b82f6', Textarea: '#8b5cf6', InputNumber: '#06b6d4',
  Select: '#f59e0b', RadioGroup: '#eab308', CheckboxGroup: '#f59e0b',
  DatePicker: '#8b5cf6', TimePicker: '#8b5cf6', Switch: '#ec4899',
  DisplayText: '#10b981', Upload: '#ec4899'
}
</script>

<template>
  <div class="fd-library">
    <div class="fd-lib-search">
      <a-input v-model:value="search" placeholder="搜索字段..." allow-clear size="small" />
    </div>
    <div ref="listRef" class="fd-lib-body">
      <template v-if="filteredPresets.length === 0">
        <div class="fd-lib-empty">无匹配字段</div>
      </template>
      <template v-for="row in groupedList" :key="row.type === 'group' ? row.name : row.data.id">
        <div v-if="row.type === 'group'" class="fd-lib-group-title">
          {{ row.name }} · {{ row.count }}
        </div>
        <div
          v-else
          class="fd-lib-item"
          :data-field="row.data.field"
          :data-type="row.data.type"
          :data-label="row.data.label"
          @click="emit('add', row.data)"
        >
          <span class="fd-lib-dot" :style="{ background: TYPE_COLORS[row.data.type] || '#94a3b8' }" />
          <span class="fd-lib-label">{{ row.data.label }}</span>
          <span class="fd-lib-type">{{ row.data.type }}</span>
          <span v-if="row.data.unit" class="fd-lib-unit">{{ row.data.unit }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.fd-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafbfc;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
}
.fd-lib-search {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.fd-lib-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.fd-lib-group-title {
  padding: 8px 14px 2px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.3px;
}
.fd-lib-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin: 1px 6px;
  border-radius: 5px;
  cursor: grab;
  font-size: 13px;
  color: #334155;
  transition: background 0.15s;
  user-select: none;
}
.fd-lib-item:hover { background: #eef2ff; }
.fd-lib-item:active { cursor: grabbing; }
.fd-lib-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fd-lib-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fd-lib-type {
  font-size: 10px;
  color: #c0c8d4;
  flex-shrink: 0;
}
.fd-lib-unit {
  font-size: 10px;
  color: #c0c8d4;
  flex-shrink: 0;
}
.fd-lib-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}
</style>
