<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Sortable from 'sortablejs'
import type { ComponentDef, FormTemplate, RuleDef } from '../types'
import { ensureTempIds, generateTempId } from './stores/designerStore'
import { uid } from '../utils/uid'
import { COMPONENT_LIBRARY } from '@/types/antd-mapping'
import ComponentLibrary from './ComponentLibrary.vue'
import CanvasItem from './CanvasItem.vue'
import PropertyPanel from './PropertyPanel.vue'

const props = defineProps<{
  item?: FormTemplate
  rightPanelWidth: number
}>()

const emit = defineEmits<{
  (e: 'update:item', value: FormTemplate): void
  (e: 'save', value: FormTemplate): void
  (e: 'cancel'): void
  (e: 'preview', value: FormTemplate): void
  (e: 'resizeStart', event: MouseEvent): void
}>()

// --------------- 数据（非受控：内部自维护 tpl，props.component 仅作可选初始值） ---------------
const tpl = ref<FormTemplate>({ id: uid('tmpl_'), components: [] })

// 初始种子：外部传入模板时深拷贝进内部状态（编辑已有模板场景），不传则保持空白新建
watch(() => props.item, (c) => {
  if (!c) return
  const copy = JSON.parse(JSON.stringify(c)) as FormTemplate
  if (copy.components) ensureTempIds(copy.components)
  tpl.value = copy
}, { immediate: true })

// 统一提交：先更新内部状态，再通知父层
function commit(next: FormTemplate) {
  tpl.value = next
  emit('update:item', next)
}

// 选中
const selectedId = ref<string | null>(null)
const selectedComponent = computed(() => {
  if (!selectedId.value) return null
  return tpl.value.components.find(c => c.id === selectedId.value) || null
})

// --------------- 增删 ---------------
function onAdd(def: ComponentDef) {
  const newDef = { ...def, id: generateTempId() }
  commit({ ...tpl.value, components: [...tpl.value.components, newDef] })
  selectedId.value = newDef.id
}

function onRemove(id: string) {
  if (selectedId.value === id) selectedId.value = null
  commit({
    ...tpl.value,
    components: tpl.value.components.filter(c => c.id !== id)
  })
}

// --------------- 属性 ---------------
function onPropertyChange(updated: ComponentDef) {
  const idx = tpl.value.components.findIndex(c => c.id === updated.id)
  if (idx >= 0) {
    const comps = [...tpl.value.components]
    comps[idx] = updated
    commit({ ...tpl.value, components: comps })
  }
}

function onRuleAdd(componentId: string, rule: RuleDef) {
  const comps = tpl.value.components.map(c =>
    c.id === componentId ? { ...c, rules: [...(c.rules ?? []), rule] } : c
  )
  commit({ ...tpl.value, components: comps })
}

function onRuleUpdate(componentId: string, ruleId: string, patch: Partial<RuleDef>) {
  const comps = tpl.value.components.map(c =>
    c.id === componentId
      ? { ...c, rules: (c.rules ?? []).map(r => r.id === ruleId ? { ...r, ...patch } : r) }
      : c
  )
  commit({ ...tpl.value, components: comps })
}

function onRuleRemove(componentId: string, ruleId: string) {
  const comps = tpl.value.components.map(c =>
    c.id === componentId
      ? { ...c, rules: (c.rules ?? []).filter(r => r.id !== ruleId) }
      : c
  )
  commit({ ...tpl.value, components: comps })
}

// --------------- SortableJS 画布 ---------------
const canvasRef = ref<HTMLElement | null>(null)
let canvasSortable: Sortable | null = null
let dragFromLibrary = false

function initCanvasSortable() {
  if (!canvasRef.value) return
  if (canvasSortable) canvasSortable.destroy()

  canvasSortable = Sortable.create(canvasRef.value, {
    group: { name: 'components', pull: false, put: true },
    animation: 150,
    handle: '.drag-handle',
    draggable: '.canvas-item',
    ghostClass: 'vf-canvas-ghost',
    chosenClass: 'vf-chosen',
    dragClass: 'vf-drag',
    emptyInsertThreshold: 10,
    onAdd(evt) {
      dragFromLibrary = true
      evt.item.remove()
      const type = evt.item.getAttribute('data-type')
      if (!type) return
      const libItem = COMPONENT_LIBRARY.find(i => i.type === type)
      if (!libItem) return

      const newDef: ComponentDef = {
        id: generateTempId(),
        type: libItem.type as ComponentDef['type'],
        field: '',
        label: libItem.label,
        props: libItem.defaultProps ? { ...libItem.defaultProps } : undefined,
        options: libItem.defaultOptions ? [...libItem.defaultOptions] : undefined
      }

      const comps = [...tpl.value.components]
      const idx = evt.newIndex !== undefined && evt.newIndex >= 0
        ? Math.min(evt.newIndex, comps.length)
        : comps.length
      comps.splice(idx, 0, newDef)
      commit({ ...tpl.value, components: comps })
      selectedId.value = newDef.id
    },
    onUpdate(evt) {
      if (dragFromLibrary) { dragFromLibrary = false; return }
      const comps = [...tpl.value.components]
      const [moved] = comps.splice(evt.oldIndex!, 1)
      comps.splice(evt.newIndex!, 0, moved)
      commit({ ...tpl.value, components: comps })
    }
  })
}

watch(() => tpl.value, () => nextTick(() => initCanvasSortable()))
onMounted(() => nextTick(() => initCanvasSortable()))
onBeforeUnmount(() => canvasSortable?.destroy())
</script>

<template>
  <div class="fd-mode-basic fd-designer-layout">
    <ComponentLibrary @add="onAdd" />
    <div class="fd-designer-center-wrapper">
      <div class="canvas-toolbar">
        <span v-if="tpl.components.length">{{ tpl.components.length }} 个字段</span>
        <span v-else class="text-muted">画布 — 从左侧拖拽组件到此处</span>
        <a-button v-if="tpl.components.length" size="small" type="primary" ghost @click="emit('preview', tpl)">预览</a-button>
      </div>
      <div class="fd-canvas-wrapper">
        <div
          ref="canvasRef"
          class="fd-canvas-sortable"
          :class="{ 'fd-canvas-empty': tpl.components.length === 0 }"
        >
          <CanvasItem
            v-for="c in tpl.components"
            :key="c.id"
            :component="c"
            :selected="selectedId === c.id"
            @select="(id: string) => selectedId = id"
            @remove="onRemove"
          />
        </div>
        <div v-if="tpl.components.length === 0" class="canvas-empty-hint">＋ 从左侧拖拽组件到此处</div>
      </div>
    </div>
    <div class="fd-designer-right" :style="{ width: rightPanelWidth + 'px' }">
      <div class="fd-resize-handle" @mousedown="$emit('resizeStart', $event)" />
      <div class="pp-right-header">
        <span v-if="selectedComponent">属性编辑</span>
        <span v-else class="text-muted">属性</span>
      </div>
      <div class="pp-right-body" v-if="selectedComponent">
        <PropertyPanel
          :component="selectedComponent"
          :components="tpl.components"
          @update:component="onPropertyChange"
          @addRule="onRuleAdd"
          @updateRule="onRuleUpdate"
          @removeRule="onRuleRemove"
        />
      </div>
    </div>
  </div>

  <div class="fd-designer-toolbar">
    <a-button type="primary" @click="emit('save', tpl)">保存</a-button>
    <a-button @click="emit('cancel')">取消</a-button>
  </div>
</template>

<style scoped>
.fd-mode-basic { display: flex; flex: 1; overflow: hidden; }
.fd-mode-basic > :first-child { width: 220px; flex-shrink: 0; }
.fd-designer-layout { display: flex; flex: 1; overflow: hidden; }
.fd-designer-center-wrapper { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.canvas-toolbar {
  height: 48px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; border-bottom: 1px solid #e5e7eb; background: #fff; font-size: 13px; color: #64748b; flex-shrink: 0;
}
.fd-designer-right { flex-shrink: 0; border-left: 1px solid var(--color-border); background: #fff; position: relative; }
.fd-resize-handle {
  position: absolute; left: -4px; top: 0; bottom: 0; width: 8px; cursor: col-resize; z-index: 10;
}
.fd-resize-handle:hover, .fd-resize-handle:active { background: rgba(22, 119, 255, 0.15); }
.fd-canvas-wrapper { flex: 1; position: relative; }
.fd-canvas-sortable {
  display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; align-content: flex-start;
  min-height: 200px; height: 100%;
}
.fd-canvas-empty { border: 2px dashed #cbd5e0; background: #fafafa; }
.canvas-empty-hint {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: #94a3b8; font-size: 14px; pointer-events: none;
}
.pp-right-header {
  height: 48px; display: flex; align-items: center; padding: 0 16px;
  border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 600; color: #1f2937; flex-shrink: 0;
}
.pp-right-body { flex: 1; overflow-y: auto; }
.fd-designer-toolbar {
  display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px;
  background: var(--color-bg-elevated, #fff); border-top: 1px solid var(--color-border, #e5e7eb);
}
:global(.vf-canvas-ghost) { opacity: 0.4; background: #dbeafe !important; border-color: #3b82f6 !important; }
</style>
