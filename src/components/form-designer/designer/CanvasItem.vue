<script setup lang="ts">
import type { ComponentDef } from '../types'

interface Props {
  component: ComponentDef
  selected?: boolean
  readonly?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'select', id: string): void
  (e: 'duplicate', id: string): void
}>()

const TYPE_ICONS: Record<string, string> = {
  Input: 'Aa', Textarea: '¶', InputNumber: '#',
  Select: '▼', RadioGroup: '◉', CheckboxGroup: '☑',
  DatePicker: '📅', TimePicker: '⏱', Switch: '◐',
  DisplayText: '👁', Table: '📊', Upload: '📎'
}
const typeIcon = (t: string) => TYPE_ICONS[t] || '◇'
</script>

<template>
  <div
    class="canvas-item"
    :class="{ active: selected, readonly }"
    :data-comp-id="component.id"
    @click.stop="emit('select', component.id)"
  >
    <!-- 顶部：图标 + label + 操作 -->
    <div class="item-top">
      <div class="item-type-icon" :class="`type-${component.type.toLowerCase()}`">
        {{ typeIcon(component.type) }}
      </div>
      <div class="item-header">
        <span class="item-label">
          {{ component.label }}
          <span v-if="component.required" class="required-mark">*</span>
        </span>
        <span class="item-meta">
          <code class="field-name">{{ component.field }}</code>
          <span v-if="component.unit" class="text-muted">· {{ component.unit }}</span>
        </span>
      </div>
      <div class="item-actions">
        <button v-if="!readonly" class="action-btn" title="复制" @click.stop="emit('duplicate', component.id)">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M5 2h6a1 1 0 0 1 1 1v1H6a1 1 0 0 0-1 1v6H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm-1 4h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
          </svg>
        </button>
        <button v-if="!readonly" class="action-btn danger" title="删除" @click.stop="emit('remove', component.id)">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M5.5 5.5v6h1v-6h-1zm2 0v6h1v-6h-1zm2 0v6h1v-6h-1z"/>
            <path d="M14.5 3h-3V1.5A1.5 1.5 0 0 0 10 0H6a1.5 1.5 0 0 0-1.5 1.5V3h-3a.5.5 0 0 0 0 1h.59l.93 10.32A1.5 1.5 0 0 0 4.51 15.5h6.98a1.5 1.5 0 0 0 1.5-1.18L13.92 4h.58a.5.5 0 0 0 0-1zM5.5 1.5A.5.5 0 0 1 6 1h4a.5.5 0 0 1 .5.5V3h-5V1.5z"/>
          </svg>
        </button>
        <span v-if="!readonly" class="drag-handle fd-canvas-drag" title="拖动排序">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <circle cx="5" cy="3" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="5" cy="13" r="1.2"/>
            <circle cx="11" cy="3" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="13" r="1.2"/>
          </svg>
        </span>
      </div>
    </div>

    <!-- 底部：规则徽章 -->
    <div v-if="component.rules && component.rules.length" class="item-bottom">
      <div class="rule-badges">
        <span
          v-for="r in component.rules"
          :key="r.id"
          class="rule-badge"
          :class="[`rule-${r.type}`, { 'rule-disabled': !r.enabled }]"
        >
          <span class="dot"></span>{{ r.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-item {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  gap: 4px;
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 6px;
}
.canvas-item:hover {
  border-color: #cbd5e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.canvas-item.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.canvas-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: #93c5fd;
  border-radius: 0 2px 2px 0;
}
.canvas-item.readonly {
  cursor: default;
}
.canvas-item.readonly:hover {
  border-color: #e5e7eb;
  box-shadow: none;
}

.item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
}
.item-type-icon {
  width: 22px;
  height: 22px;
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
.item-type-icon.type-input { background: #dbeafe; color: #1d4ed8; }
.item-type-icon.type-inputnumber { background: #ecfeff; color: #0891b2; }
.item-type-icon.type-textarea { background: #ede9fe; color: #6d28d9; }
.item-type-icon.type-select,
.item-type-icon.type-radiogroup,
.item-type-icon.type-checkboxgroup { background: #fef3c7; color: #b45309; }
.item-type-icon.type-datepicker,
.item-type-icon.type-timepicker { background: #ede9fe; color: #6d28d9; }
.item-type-icon.type-switch { background: #fce7f3; color: #be185d; }
.item-type-icon.type-displaytext { background: #d1fae5; color: #047857; }
.item-type-icon.type-table { background: #dbeafe; color: #1d4ed8; }
.item-type-icon.type-upload { background: #fce7f3; color: #be185d; }

.item-header {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.item-label {
  font-weight: 600;
  font-size: 13px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  max-width: 60%;
}
.required-mark { color: #ef4444; margin-left: 2px; }
.item-meta {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
}
.field-name {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  color: #475569;
  font-family: 'SF Mono', Menlo, Monaco, monospace;
}
.text-muted { color: #94a3b8; }

.item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.canvas-item:hover .item-actions,
.canvas-item.active .item-actions { opacity: 1; }
.action-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
}
.action-btn:hover { background: #f1f5f9; color: #475569; }
.action-btn.danger:hover { background: #fee2e2; color: #dc2626; }
.drag-handle {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e0;
  cursor: grab;
  border-radius: 4px;
  transition: color 0.15s;
}
.drag-handle:hover { color: #64748b; background: #f1f5f9; }
.drag-handle:active { cursor: grabbing; }

.item-bottom {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px dashed #f1f5f9;
}
.rule-badges { display: flex; gap: 4px; flex-wrap: wrap; }
.rule-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rule-badge .dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.rule-badge.rule-calculation { background: #f3e8ff; color: #7e22ce; }
.rule-badge.rule-threshold { background: #ffedd5; color: #c2410c; }
.rule-badge.rule-comparison { background: #fef9c3; color: #a16207; }
.rule-badge.rule-conditional { background: #cffafe; color: #0e7490; }
.rule-badge.rule-validation { background: #dcfce7; color: #15803d; }
.rule-badge.rule-disabled {
  background: #f1f5f9;
  color: #94a3b8;
  opacity: 0.6;
  text-decoration: line-through;
}
</style>
