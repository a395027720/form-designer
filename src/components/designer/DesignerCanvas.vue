<template>
  <div class="designer-canvas">
    <div class="canvas-toolbar">
      <span class="text-muted">
        <span v-if="components.length">{{ components.length }} 个字段</span>
        <span v-else>画布</span>
      </span>
      <a-space>
        <a-button size="small" type="text" @click="$emit('preview')">预览</a-button>
      </a-space>
    </div>

    <div class="canvas-body">
      <div
        ref="canvasEl"
        class="canvas-list"
        :class="{ 'canvas-list-empty': components.length === 0 }"
      >
        <CanvasItem
          v-for="comp in components"
          :key="comp.id"
          :comp="comp"
          :selected-id="props.selectedId"
          @select="(id) => emit('select', id)"
          @duplicate="duplicate"
          @remove="confirmRemove"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Sortable from 'sortablejs'
import { Modal } from 'ant-design-vue'
import { useTemplateStore } from '@/stores/templateStore'
import { COMPONENT_LIBRARY } from '@/types/antd-mapping'
import type { ComponentDef, ComponentLibraryItem, ComponentType } from '@/types/template'
import { uid } from '@/utils/uid'
import { findComponentById, removeComponentById, deepCloneComponent } from '@/utils/componentTree'
import CanvasItem from './CanvasItem.vue'

const props = defineProps<{ selectedId: string | null }>()
const emit = defineEmits<{
  select: [id: string]
  preview: []
}>()

const store = useTemplateStore()
const canvasEl = ref<HTMLElement | null>(null)
let sortable: Sortable | null = null

const components = computed(() => store.template?.components || [])

const TYPE_ICONS: Record<ComponentType, string> = {
  Input: 'Aa',
  Textarea: '¶',
  InputNumber: '#',
  Select: '▼',
  RadioGroup: '◉',
  CheckboxGroup: '☑',
  DatePicker: '📅',
  TimePicker: '⏱',
  Switch: '◐',
  DisplayText: '👁',
  Card: '🃏',
  Fieldset: '📦',
  Collapse: '🔽'
}

const typeIcon = (t: ComponentType) => TYPE_ICONS[t] || '◇'

const initSortable = () => {
  if (!canvasEl.value) return
  if (sortable) {
    sortable.destroy()
    sortable = null
  }
  sortable = Sortable.create(canvasEl.value, {
    group: { name: 'components', pull: false, put: true },
    animation: 180,
    handle: '.drag-handle',
    draggable: '.canvas-item',     // 关键：只把 canvas-item 当作 sortable item
    ghostClass: 'vf-ghost',
    chosenClass: 'vf-chosen',
    dragClass: 'vf-drag',
    emptyInsertThreshold: 25,
    swapThreshold: 0.6,
    onAdd: (evt) => {
      try {
        handleAdd(evt)
      } catch (e) {
        console.error('[DesignerCanvas] handleAdd 出错:', e)
      }
    },
    onUpdate: (evt) => {
      try {
        handleUpdate(evt)
      } catch (e) {
        console.error('[DesignerCanvas] handleUpdate 出错:', e)
      }
    }
  })
  console.log('[DesignerCanvas] SortableJS 初始化完成, items:', canvasEl.value.querySelectorAll('.canvas-item').length)
}

const handleAdd = (evt: Sortable.SortableEvent) => {
  const dom = evt.item as HTMLElement
  const type = dom.dataset.type
    || (dom as any).__libType
    || ''
  // 先移除 SortableJS 插入的 drag image DOM
  if (dom.parentNode) dom.parentNode.removeChild(dom)
  const libItem = COMPONENT_LIBRARY.find(i => i.type === type)
  if (!libItem) {
    console.warn('[DesignerCanvas] 未识别的组件类型:', type)
    return
  }
  if (!store.template) return
  const newComp = buildComponent(libItem)
  const idx = evt.newIndex !== undefined && evt.newIndex >= 0
    ? Math.min(evt.newIndex, store.template.components.length)
    : store.template.components.length
  // 深拷贝 → 修改 → 赋值，确保响应式触发
  const t = JSON.parse(JSON.stringify(store.template))
  t.components.splice(idx, 0, newComp)
  store.template = t
  store.selectedComponentId = newComp.id
  emit('select', newComp.id)
}

const handleUpdate = (evt: Sortable.SortableEvent) => {
  if (!store.template) return
  const t = JSON.parse(JSON.stringify(store.template))
  const moved = t.components.splice(evt.oldIndex!, 1)[0]
  t.components.splice(evt.newIndex!, 0, moved)
  store.template = t
}

const buildComponent = (item: ComponentLibraryItem): ComponentDef => {
  const id = uid('comp_')
  const base: ComponentDef = {
    id,
    type: item.type,
    field: item.type === 'DisplayText' ? 'display_' + id.slice(-4) : item.type.toLowerCase() + '_' + id.slice(-4),
    label: item.label + '（未命名）',
    required: false,
    props: { ...(item.defaultProps || {}) },
    options: item.defaultOptions ? JSON.parse(JSON.stringify(item.defaultOptions)) : undefined,
    rules: [],
    defaultValue: undefined
  }
  return base
}

const duplicate = (id: string) => {
  if (!store.template) return
  const src = findComponentById(store.template.components, id)
  if (!src) return
  const clone = deepCloneComponent(src)
  const t = JSON.parse(JSON.stringify(store.template))
  t.components.push(clone)
  store.template = t
  store.selectedComponentId = clone.id
  emit('select', clone.id)
}

const confirmRemove = (id: string) => {
  Modal.confirm({
    title: '确定删除这个组件？',
    content: '删除后该字段及其规则将一并移除，此操作不可撤销',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      if (!store.template) return
      // 深拷贝后删除，再整体赋值确保所有层级响应式触发
      const t = JSON.parse(JSON.stringify(store.template))
      removeComponentById(t.components, id)
      store.template = t
      if (store.selectedComponentId === id) {
        const first = findComponentById(store.template.components, store.template.components[0]?.id)
        store.selectedComponentId = first?.id || null
      }
    }
  })
}

onMounted(() => {
  nextTick(initSortable)
})

onBeforeUnmount(() => {
  sortable?.destroy()
})
</script>

<style scoped>
.designer-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
  overflow: hidden;
}
.canvas-toolbar {
  height: 48px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}
.canvas-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

/* 列表容器 - flex wrap，模拟 24 列栅格的视觉 */
.canvas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  flex: 1;
  align-items: flex-start;
  align-content: flex-start;
}
.canvas-list-empty {
  border: 2px dashed #cbd5e0;
  border-radius: 10px;
  background: #fff;
}
.canvas-list-empty:hover,
.canvas-list-empty.sortable-ghost,
.canvas-list-empty.vf-ghost {
  border-color: #3b82f6;
  background: #eff6ff;
}

/* 字段卡片 - 用 flex-basis 实现 columns 宽度（与渲染器 1:1 一致） */
.canvas-item {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  gap: 8px;
  box-sizing: border-box;
}

/* 拖拽视觉反馈 - 全局 */
:global(.vf-ghost) {
  opacity: 0.4;
  background: #dbeafe !important;
  border-color: #3b82f6 !important;
}
:global(.vf-chosen) {
  cursor: grabbing !important;
}
:global(.vf-drag) {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  border-radius: 8px;
}
</style>