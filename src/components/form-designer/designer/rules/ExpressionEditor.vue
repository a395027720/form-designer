<template>
  <div class="expression-editor">
    <div class="ee-toolbar">
      <a-dropdown>
        <a-button size="small">
          📋 插入字段
        </a-button>
        <template #overlay>
          <a-menu @click="onInsertField">
            <a-menu-item
              v-for="c in otherComponents"
              :key="c.id"
            >
              {{ c.label }} <span class="text-muted">({{ c.field }})</span>
            </a-menu-item>
            <a-menu-item v-if="otherComponents.length === 0" :key="'__empty__'" disabled>
              还没有其他字段
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>

      <a-button-group size="small">
        <a-button @click="insert(' + ')">+</a-button>
        <a-button @click="insert(' - ')">−</a-button>
        <a-button @click="insert(' * ')">×</a-button>
        <a-button @click="insert(' / ')">÷</a-button>
        <a-button @click="insert('(')">(</a-button>
        <a-button @click="insert(')')">)</a-button>
      </a-button-group>

      <a-tag :color="status.color" style="margin-left: auto">
        {{ status.text }}
      </a-tag>
    </div>

    <!-- 可读表达式：主视觉 -->
    <div v-if="model" class="ee-readable">
      <code>{{ translate(model) }}</code>
    </div>

    <a-textarea
      ref="textareaRef"
      v-model:value="model"
      :rows="1"
      placeholder="点击「插入字段」或直接输入表达式"
      @change="evaluate"
    />

    <div v-if="model" class="ee-preview">
      <span class="text-muted">预览：</span>
      <span v-if="hasUndefined" class="text-warning">
        引用了未填字段，结果暂不可用
      </span>
      <span v-else class="preview-value">
        {{ previewValue }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentDef } from '../../types'
import { ExpressionEvaluator } from '../../runtime/ExpressionEvaluator'

const props = defineProps<{
  modelValue: string
  components: ComponentDef[]
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const textareaRef = ref()
const previewValue = ref<any>(undefined)
const hasUndefined = ref(false)

const otherComponents = computed(() => props.components)

const status = computed(() => {
  if (!model.value.trim()) return { color: 'default', text: '空' }
  if (hasUndefined.value) return { color: 'warning', text: '⚠ 部分字段未填' }
  if (previewValue.value === undefined) return { color: 'red', text: '✗ 语法错误' }
  return { color: 'green', text: '✓ 语法正确' }
})

const onInsertField = ({ key }: { key: string }) => {
  insert(`$.components.${key}.value`)
}

const insert = (text: string) => {
  emit('update:modelValue', model.value + text)
}

const evaluate = () => {
  if (!model.value.trim()) {
    previewValue.value = undefined
    hasUndefined.value = false
    return
  }
  const fakeValues = new Map<string, any>()
  let undefinedHit = false
  for (const c of props.components) {
    fakeValues.set(c.id, c.defaultValue !== undefined ? c.defaultValue : (c.type === 'InputNumber' ? 10 : c.type === 'Input' ? 'test' : 1))
  }
  const ev = new ExpressionEvaluator((id) => {
    if (!fakeValues.has(id)) {
      undefinedHit = true
      return undefined
    }
    return fakeValues.get(id)
  })
  const r = ev.evaluate(model.value)
  previewValue.value = r
  hasUndefined.value = undefinedHit
}

watch(() => props.modelValue, evaluate, { immediate: true })

/** 将表达式中的 $.components.xxx.value 替换为可读字段标签 */
const translate = (expr: string): string => {
  if (!expr) return ''
  return expr.replace(
    /\$\.components\.([a-zA-Z0-9_]+)\.value/g,
    (_, id) => {
      const c = props.components.find(c => c.id === id)
      return c ? c.label : id
    }
  )
}
</script>

<style scoped>
.expression-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ee-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ee-readable {
  padding: 10px 12px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.7;
  color: #1f2937;
  font-family: 'SF Mono', Menlo, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
.ee-preview {
  padding: 8px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-size: 13px;
}
.preview-value {
  font-weight: 600;
  color: #389e0d;
  font-family: 'Menlo', 'Monaco', monospace;
}
</style>
