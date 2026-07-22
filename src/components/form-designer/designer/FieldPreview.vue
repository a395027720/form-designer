<script setup lang="ts">
/**
 * 检查报告字段预览（运行时/设计器通用）
 * - 使用 antd <a-table> 作为容器，让表格自身样式生效
 * - 4 列：字段 / 结果 / 单位 / 参考范围
 * - 行级自定义：必填星号、自动计算禁用、阈值样式、规则后缀、错误提示
 */
import { computed } from 'vue'
import type { ComponentDef, FormTemplate } from '../types'
import type { FieldState } from '../runtime/ActionApplier'

interface Props {
  template: FormTemplate
  values?: Record<string, any>
  states?: Record<string, FieldState>
  errors?: Record<string, string | undefined>
  readOnly?: boolean
  /** 控件宽度（CSS width），默认 '100%' */
  componentWidth?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  values: () => ({}),
  states: () => ({}),
  errors: () => ({}),
  readOnly: false,
  componentWidth: '100%'
})

const emit = defineEmits<{
  (e: 'field-change', payload: { id: string, value: any }): void
}>()

interface ReportRow {
  id: string
  label: string
  required: boolean
  disabled: boolean
  component: ComponentDef
  unit?: string
  range?: string
  suffix?: string
  style?: Record<string, string>
  classes?: string[]
  striped?: boolean
}

function getFieldMeta(c: ComponentDef): { unit?: string; range?: string } {
  const meta: { unit?: string; range?: string } = {}
  if (c.unit) meta.unit = c.unit
  const min = c.props?.min
  const max = c.props?.max
  if (min != null && max != null) meta.range = `${min} ~ ${max}`
  else if (min != null) meta.range = `≥ ${min}`
  else if (max != null) meta.range = `≤ ${max}`
  return meta
}

const rows = computed<ReportRow[]>(() => {
  const result: ReportRow[] = []
  for (let i = 0; i < props.template.components.length; i++) {
    const c = props.template.components[i]
    const s = props.states[c.id]
    if (s?.visible === false) continue
    const meta = getFieldMeta(c)
    result.push({
      id: c.id,
      label: c.label,
      required: s?.required ?? !!c.required,
      disabled: s?.autoCalculated || props.readOnly,
      component: c,
      unit: meta.unit,
      range: meta.range,
      suffix: s?.suffix,
      style: s?.style,
      classes: s?.classes,
      striped: i % 2 === 1
    })
  }
  return result
})

/**
 * 列定义只用 title / key / width，单元格内容由 #bodyCell slot 渲染。
 * 不在 columns 里写 customRender，避免 h() 中 global component 解析不稳定的问题。
 */
const columns = [
  { key: 'label', title: '字段', width: '22%', align: 'right' as const },
  { key: 'value', title: '结果' },
  { key: 'unit', title: '单位', width: '12%', align: 'center' as const },
  { key: 'range', title: '参考范围', width: '18%', align: 'center' as const }
]

function emitChange(id: string, v: any) {
  if (props.readOnly) return
  emit('field-change', { id, value: v })
}

/** 把 number 自动转为 px 字符串（'100%'、'320px'、'20rem' 都原样使用） */
const widthStyle = computed(() => {
  const w = props.componentWidth
  if (typeof w === 'number') return `${w}px`
  return w ?? '100%'
})

function customRow(record: ReportRow) {
  return {
    class: record.disabled ? 'fd-row-disabled' : '',
    attrs: { 'data-component-id': record.id }
  }
}

/** 把 state.style 的 color 转成 CSS 变量，穿透到输入框内部文本 */
const valueCellStyle = (record: ReportRow): Record<string, string> => {
  const s: Record<string, string> = {}
  if (record.style?.color) s['--vf-dynamic-color'] = record.style.color
  return s
}
</script>

<template>
  <a-table
    class="fd-report"
    :dataSource="rows"
    :columns="columns"
    row-key="id"
    :customRow="customRow"
    :pagination="false"
    :bordered="true"
    size="small"
  >
    <template #bodyCell="{ column, record }">
      <!-- 字段名 -->
      <template v-if="column.key === 'label'">
        <div class="fd-label-line">
          <span :class="{ 'fd-required': record.required }">{{ record.label }}</span>
        </div>
      </template>

      <!-- 结果：按 component.type 分发 -->
      <template v-else-if="column.key === 'value'">
        <div class="fd-value-wrap" :class="record.classes" :style="valueCellStyle(record)">
          <a-input
            v-if="record.component.type === 'Input'"
            :value="values[record.id]"
            :placeholder="record.component.props?.placeholder"
            :maxlength="record.component.props?.maxLength"
            :disabled="record.disabled"
            allow-clear
            :style="{ width: widthStyle }"
            @update:value="(v: any) => emitChange(record.id, v)"
          />
          <a-textarea
            v-else-if="record.component.type === 'Textarea'"
            :value="values[record.id]"
            :placeholder="record.component.props?.placeholder"
            :maxlength="record.component.props?.maxLength"
            :rows="record.component.props?.rows ?? 3"
            :disabled="record.disabled"
            :style="{ width: widthStyle }"
            @update:value="(v: any) => emitChange(record.id, v)"
          />
          <a-input-number
            v-else-if="record.component.type === 'InputNumber'"
            :value="values[record.id]"
            :min="record.component.props?.min"
            :max="record.component.props?.max"
            :precision="record.component.props?.precision"
            :placeholder="record.component.props?.placeholder"
            :disabled="record.disabled"
            :style="{ width: widthStyle }"
            @update:value="(v: any) => emitChange(record.id, v)"
          />
          <a-select
            v-else-if="record.component.type === 'Select'"
            :value="values[record.id]"
            :options="(record.component.options || []).map((o: any) => ({ label: o.label, value: o.value }))"
            :placeholder="record.component.props?.placeholder || '请选择'"
            :disabled="record.disabled"
            :allow-clear="true"
            :style="{ width: widthStyle }"
            @update:value="(v: any) => emitChange(record.id, v)"
          />
          <a-radio-group
            v-else-if="record.component.type === 'RadioGroup'"
            :value="values[record.id]"
            :disabled="record.disabled"
            @update:value="(v: any) => emitChange(record.id, v)"
          >
            <a-radio
              v-for="o in record.component.options"
              :key="o.value"
              :value="o.value"
            >{{ o.label }}</a-radio>
          </a-radio-group>
          <a-checkbox-group
            v-else-if="record.component.type === 'CheckboxGroup'"
            :value="values[record.id] || []"
            :disabled="record.disabled"
            @update:value="(v: any) => emitChange(record.id, v)"
          >
            <a-checkbox
              v-for="o in record.component.options"
              :key="o.value"
              :value="o.value"
            >{{ o.label }}</a-checkbox>
          </a-checkbox-group>
          <a-date-picker
            v-else-if="record.component.type === 'DatePicker'"
            :value="values[record.id]"
            :format="record.component.props?.format"
            :disabled="record.disabled"
            :style="{ width: widthStyle }"
            @update:value="(v: any) => emitChange(record.id, v)"
          />
          <a-time-picker
            v-else-if="record.component.type === 'TimePicker'"
            :value="values[record.id]"
            :format="record.component.props?.format"
            :disabled="record.disabled"
            :style="{ width: widthStyle }"
            @update:value="(v: any) => emitChange(record.id, v)"
          />
          <a-switch
            v-else-if="record.component.type === 'Switch'"
            :checked="!!values[record.id]"
            :disabled="record.disabled"
            @update:checked="(v: any) => emitChange(record.id, v)"
          />
          <div
            v-else-if="record.component.type === 'DisplayText'"
            class="fd-display-text"
            :style="{ ...record.style, width: widthStyle }"
          >
            {{ record.component.props?.prefix || '' }}{{ values[record.id] ?? '[计算结果将在这里展示]' }}{{ record.component.props?.suffix || '' }}
          </div>
          <a-upload
            v-else-if="record.component.type === 'Upload'"
            :file-list="values[record.id] ?? []"
            :accept="record.component.props?.accept ?? 'image/*'"
            :list-type="record.component.props?.listType ?? 'picture-card'"
            :disabled="record.disabled"
            @update:file-list="(v: any) => emitChange(record.id, v)"
          >
            <a-button v-if="(values[record.id]?.length ?? 0) < (record.component.props?.maxCount ?? 5)">
              上传
            </a-button>
          </a-upload>
          <div v-else class="fd-unknown-type">未知类型: {{ record.component.type }}</div>

          <a-tag v-if="record.suffix" color="red" class="fd-suffix-tag">
            {{ record.suffix }}
          </a-tag>
          <span v-if="errors[record.id]" class="fd-error">{{ errors[record.id] }}</span>
        </div>
      </template>

      <!-- 单位 -->
      <template v-else-if="column.key === 'unit'">
        <span v-if="record.unit" class="fd-unit">{{ record.unit }}</span>
      </template>

      <!-- 参考范围 -->
      <template v-else-if="column.key === 'range'">
        <span v-if="record.range" class="fd-range">{{ record.range }}</span>
      </template>
    </template>

    <template #emptyText>
      <span class="fd-empty">暂无字段</span>
    </template>
  </a-table>
</template>

<style scoped>
/* 让 antd a-table 自身的边框 / 斑马纹 / 圆角样式自然生效，不再覆盖 */
.fd-report {
  font-size: 13px;
}
.fd-label-line {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}
.fd-required {
  font-weight: 500;
}
.fd-required::before {
  content: '*';
  color: #ef4444;
  margin-right: 4px;
}
.fd-suffix-tag {
  font-size: 12px;
  margin: 0;
}
.fd-value-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
.fd-value-wrap > :deep(.ant-input),
.fd-value-wrap > :deep(.ant-input-number),
.fd-value-wrap > :deep(.ant-select),
.fd-value-wrap > :deep(.ant-picker),
.fd-value-wrap > :deep(.ant-radio-group) {
  flex: 1 1 auto;
  min-width: 0;
}
.fd-error {
  color: #f5222d;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.fd-unit,
.fd-range {
  color: #6b7280;
  font-size: 12px;
}
.fd-display-text {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-weight: 500;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
}
.fd-unknown-type {
  color: #94a3b8;
  padding: 8px;
  border: 1px dashed #cbd5e0;
  border-radius: 4px;
}
.fd-empty {
  padding: 24px;
  color: #94a3b8;
}
.fd-row-disabled {
  opacity: 0.85;
}
/* 规则副作用（阈值/比较）设置的字体颜色穿透到输入框内部文本 */
.fd-value-wrap :deep(.ant-input),
.fd-value-wrap :deep(.ant-input-number-input),
.fd-value-wrap :deep(.ant-select-selector),
.fd-value-wrap :deep(.ant-picker-input input) {
  color: var(--vf-dynamic-color, inherit);
}
/* 比较规则副作用：异常时输入框红边框 */
.fd-value-wrap.is-abnormal :deep(.ant-input),
.fd-value-wrap.is-abnormal :deep(.ant-input-number),
.fd-value-wrap.is-abnormal :deep(.ant-select-selector),
.fd-value-wrap.is-abnormal :deep(.ant-picker) {
  border-color: #f5222d !important;
  box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.1) !important;
}
</style>
