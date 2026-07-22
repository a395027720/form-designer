<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormDesignerProps, FormDesignerEmits, ComponentDef, FormTemplate, RuleDef } from './types'
import FieldLibrary from './designer/FieldLibrary.vue'
import CanvasItem from './designer/CanvasItem.vue'
import PropertyPanel from './designer/PropertyPanel.vue'
import BasicDesigner from './designer/BasicDesigner.vue'
import PresetsDesigner from './designer/PresetsDesigner.vue'

const props = defineProps<FormDesignerProps>()
const emit = defineEmits<FormDesignerEmits>()

const isFieldMode = computed(() => props.mode === 'field')
const isBasicMode = computed(() => props.mode === 'basic')
const isPresetsMode = computed(() => props.mode === 'presets')

// --------------- 右侧面板宽度（field/basic/presets 共享） ---------------
const rightPanelWidth = ref(340)
const isResizing = ref(false)

function onResizeStart(e: MouseEvent) {
  isResizing.value = true
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  e.preventDefault()
}
function onResizeMove(e: MouseEvent) {
  if (!isResizing.value) return
  const container = (e.target as HTMLElement).closest('.fd-designer-layout')
  const rect = container?.getBoundingClientRect()
  if (!rect) return
  rightPanelWidth.value = Math.max(280, Math.min(560, rect.right - e.clientX))
}
function onResizeEnd() {
  isResizing.value = false
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

// --------------- field mode ---------------
const fieldDef = computed(() => props.item as ComponentDef)
const selectedType = computed(() => fieldDef.value.type)
const fieldModeFields = computed(() => props.items ?? [])

function onFieldTypeChange(type: ComponentDef['type']) {
  emit('update:item',{ ...fieldDef.value, type })
}
function onFieldPropertyChange(updated: ComponentDef) {
  emit('update:item',updated)
}
function onFieldRuleAdd(cid: string, rule: RuleDef) {
  emit('update:item',{ ...fieldDef.value, rules: [...(fieldDef.value.rules ?? []), rule] })
}
function onFieldRuleUpdate(cid: string, rid: string, patch: Partial<RuleDef>) {
  emit('update:item',{
    ...fieldDef.value,
    rules: (fieldDef.value.rules ?? []).map(r => r.id === rid ? { ...r, ...patch } : r)
  })
}
function onFieldRuleRemove(cid: string, rid: string) {
  emit('update:item',{
    ...fieldDef.value,
    rules: (fieldDef.value.rules ?? []).filter(r => r.id !== rid)
  })
}

// --------------- basic / presets 通路 ---------------
function onBasicPresetsUpdate(t: FormTemplate) { emit('update:item',t) }
function onBasicPresetsSave(t: FormTemplate) { emit('save', t) }
function onBasicPresetsCancel() { emit('cancel') }
function onBasicPresetsPreview(t: FormTemplate) { emit('preview', t) }
</script>

<template>
  <div class="fd-designer" :class="`fd-mode-${mode}`">
    <!-- field mode -->
    <div v-if="isFieldMode" class="fd-mode-field fd-designer-layout">
      <FieldLibrary :modelValue="selectedType" @update:modelValue="onFieldTypeChange" />
      <div class="fd-designer-center-wrapper">
        <div class="canvas-toolbar">
          <span class="text-muted">画布 — 从左侧切换组件类型</span>
          <a-button size="small" type="primary" ghost @click="emit('preview', fieldDef)">预览</a-button>
        </div>
        <div class="fd-canvas-wrapper">
          <div class="fd-canvas-sortable">
            <CanvasItem :component="fieldDef" :selected="true" :readonly="true" />
          </div>
        </div>
      </div>
      <div class="fd-designer-right" :style="{ width: rightPanelWidth + 'px' }">
        <div class="fd-resize-handle" @mousedown="onResizeStart" />
        <PropertyPanel
          :component="fieldDef"
          :components="fieldModeFields"
          @update:component="onFieldPropertyChange"
          @addRule="onFieldRuleAdd"
          @updateRule="onFieldRuleUpdate"
          @removeRule="onFieldRuleRemove"
        />
      </div>
    </div>

    <!-- basic mode -->
    <BasicDesigner
      v-else-if="isBasicMode"
      :item="(item as FormTemplate | undefined)"
      :rightPanelWidth="rightPanelWidth"
      @update:item="onBasicPresetsUpdate"
      @save="onBasicPresetsSave"
      @cancel="onBasicPresetsCancel"
      @preview="onBasicPresetsPreview"
      @resize-start="onResizeStart"
    />

    <!-- presets mode -->
    <PresetsDesigner
      v-else-if="isPresetsMode"
      :item="(item as FormTemplate | undefined)"
      :items="(items ?? [])"
      :rightPanelWidth="rightPanelWidth"
      :searchFn="props.searchFn"
      @update:item="onBasicPresetsUpdate"
      @save="onBasicPresetsSave"
      @cancel="onBasicPresetsCancel"
      @preview="onBasicPresetsPreview"
      @resize-start="onResizeStart"
    />

    <!-- field 模式的工具栏 -->
    <div v-if="isFieldMode" class="fd-designer-toolbar">
      <a-button type="primary" @click="emit('save', fieldDef)">保存</a-button>
      <a-button @click="emit('cancel')">取消</a-button>
    </div>
  </div>
</template>

<style scoped>
.fd-designer { height: 100%; display: flex; flex-direction: column; }
.fd-designer-layout { display: flex; flex: 1; overflow: hidden; }
.fd-designer-layout > :first-child { width: 220px; flex-shrink: 0; }
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
.fd-canvas-sortable { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; align-content: flex-start; min-height: 200px; height: 100%; }
.fd-designer-toolbar {
  display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px;
  background: var(--color-bg-elevated, #fff); border-top: 1px solid var(--color-border, #e5e7eb);
}
</style>
