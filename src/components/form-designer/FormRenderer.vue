<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue'
import type { FormRendererProps, FormRendererEmits, ValidationParams, ComponentDef } from './types'
import FieldPreview from './designer/FieldPreview.vue'
import { RuleEngine } from './runtime/RuleEngine'
import {
  createDefaultState,
  patchState,
  type FieldState
} from './runtime/ActionApplier'

const props = withDefaults(defineProps<FormRendererProps>(), {
  componentWidth: '100%'
})
const emit = defineEmits<FormRendererEmits>()

const values = reactive<Record<string, any>>({})
// engine 内部的 values 是 Map<string, any>,这里手动同步以避免响应式代理不一致
const valuesMap = new Map<string, any>()
const states = reactive<Record<string, FieldState>>({})
const errors = reactive<Record<string, string | undefined>>({})

let engine: RuleEngine | null = null

function setFieldState(id: string, patch: any) {
  if (!states[id]) states[id] = createDefaultState()
  states[id] = patchState(states[id], patch)
}

function getInitialValue(c: ComponentDef): any {
  const iv = props.formData
  if (iv && Object.prototype.hasOwnProperty.call(iv, c.field)) return iv[c.field]
  return c.defaultValue
}

function initState() {
  for (const c of props.component.components) {
    const v = getInitialValue(c)
    values[c.id] = v
    valuesMap.set(c.id, v)
    states[c.id] = createDefaultState()
    if (c.required) states[c.id]!.required = true
    errors[c.id] = undefined
  }
}

function isRequired(c: ComponentDef): boolean {
  if (states[c.id]?.required) return true
  return !!c.required
}

function validateField(id: string): string | undefined {
  const comp = props.component.components.find(c => c.id === id)
  if (!comp) return undefined
  const v = values[id]
  if (isRequired(comp) && (v === undefined || v === null || v === '')) {
    return `${comp.label}不能为空`
  }
  // 组件 props.min/max 自动产生校验(无需显式 validation 规则)
  if (v !== undefined && v !== null && v !== '') {
    const n = Number(v)
    if (comp.props?.min != null && !isNaN(n) && n < Number(comp.props.min)) {
      return `${comp.label}不能小于 ${comp.props.min}`
    }
    if (comp.props?.max != null && !isNaN(n) && n > Number(comp.props.max)) {
      return `${comp.label}不能大于 ${comp.props.max}`
    }
  }
  for (const rule of comp.rules ?? []) {
    if (!rule.enabled || rule.type !== 'validation') continue
    const p = rule.params as ValidationParams
    for (const validator of p.validators || []) {
      if (validator.type === 'required' && (v === undefined || v === null || v === '')) {
        return validator.message
      }
      if (validator.type === 'min' && v !== undefined && v !== null && v !== '' && Number(v) < Number(validator.value)) {
        return validator.message
      }
      if (validator.type === 'max' && v !== undefined && v !== null && v !== '' && Number(v) > Number(validator.value)) {
        return validator.message
      }
      if (validator.type === 'minLength' && v !== undefined && v !== null && String(v).length < Number(validator.value)) {
        return validator.message
      }
      if (validator.type === 'maxLength' && v !== undefined && v !== null && String(v).length > Number(validator.value)) {
        return validator.message
      }
      if (validator.type === 'regex' && v !== undefined && v !== '' && validator.pattern) {
        try {
          if (!new RegExp(validator.pattern).test(String(v))) {
            return validator.message
          }
        } catch {
          /* invalid regex */
        }
      }
    }
  }
  return undefined
}

function runValidation(id: string) {
  errors[id] = validateField(id)
}

function collectFormData(): Record<string, any> {
  const data: Record<string, any> = {}
  for (const c of props.component.components) {
    if (c.field) data[c.field] = values[c.id]
  }
  return data
}

function emitFormData() {
  const data = collectFormData()
  emit('update:formData', data)
}

function onFieldChange(payload: { id: string, value: any }) {
  if (states[payload.id]?.autoCalculated) return
  values[payload.id] = payload.value
  valuesMap.set(payload.id, payload.value)
  errors[payload.id] = undefined
  engine?.onValueChange(payload.id, payload.value)
  runValidation(payload.id)
  const comp = props.component.components.find(c => c.id === payload.id)
  if (comp?.field) {
    emit('field-change', { field: comp.field, value: payload.value })
  }
  emitFormData()
}

function onReset() {
  initState()
  engine?.runInit()
}

/**
 * 公开 API:提交校验 + 返回 formData
 * - 返回 { ok: true, data } 表示校验通过
 * - 返回 { ok: false, errors } 表示有字段未通过校验
 */
function submit(): { ok: boolean; data?: Record<string, any>; errors?: Record<string, string | undefined> } {
  let hasError = false
  for (const c of props.component.components) {
    runValidation(c.id)
    if (errors[c.id]) hasError = true
  }
  if (hasError) {
    return { ok: false, errors: { ...errors } }
  }
  const data = collectFormData()
  emit('update:formData', data)
  return { ok: true, data }
}

/** 公开 API:重置到初始值 */
function reset() {
  onReset()
}

/** 公开 API:读取当前 formData */
function getFormData(): Record<string, any> {
  return collectFormData()
}

/** 公开 API:读取当前字段值(按 component id 索引) */
function getValues(): Record<string, any> {
  return { ...values }
}

/** 公开 API:读取当前校验错误(按 component id 索引) */
function getErrors(): Record<string, string | undefined> {
  return { ...errors }
}

defineExpose({ submit, reset, getFormData, getValues, getErrors })

// setup 同步初始化,避免 onMounted 异步延迟导致 values/states 为空
initState()
engine = new RuleEngine({
  components: props.component.components,
  values: valuesMap,
  setFieldState
})
engine.onCalculationValue = (id, v) => {
  states[id] = { ...(states[id] || createDefaultState()), autoCalculated: true }
  values[id] = v
  valuesMap.set(id, v)
  engine?.onValueChange(id, v)
  runValidation(id)
}
engine.runInit()

onMounted(() => {
  // 兜底:若 props.component 延迟可用,再跑一次
  engine?.runInit()
})

watch(() => props.component, () => {
  initState()
  engine?.runInit()
}, { deep: true })
</script>

<template>
  <div class="fd-form">
    <FieldPreview
      :template="component"
      :values="values"
      :states="states"
      :errors="errors"
      :component-width="componentWidth"
      @field-change="onFieldChange"
    />
  </div>
</template>

<style scoped>
.fd-form {
  font-size: 13px;
  color: #1f2937;
}
</style>