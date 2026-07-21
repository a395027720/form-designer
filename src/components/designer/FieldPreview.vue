<template>
  <div class="field-preview" :class="props.classes" :style="containerStyle">
    <a-input
      v-if="component.type === 'Input'"
      :value="innerValue ?? ''"
      :placeholder="component.props?.placeholder"
      :maxlength="component.props?.maxLength"
      :disabled="disabled"
      :style="{ width: component.inputWidth ? component.inputWidth + 'px' : '100%' }"
      @update:value="(v: any) => emitChange(v)"
    />
    <a-textarea
      v-else-if="component.type === 'Textarea'"
      :value="innerValue ?? ''"
      :placeholder="component.props?.placeholder"
      :rows="component.props?.rows ?? 3"
      :disabled="disabled"
      :style="{ width: component.inputWidth ? component.inputWidth + 'px' : '100%' }"
      @update:value="(v: any) => emitChange(v)"
    />
    <a-input-number
      v-else-if="component.type === 'InputNumber'"
      :value="innerValue"
      :min="component.props?.min ?? undefined"
      :max="component.props?.max ?? undefined"
      :precision="component.props?.precision ?? undefined"
      :placeholder="component.props?.placeholder"
      :disabled="disabled"
      :style="{ width: component.inputWidth ? component.inputWidth + 'px' : '100%' }"
      @update:value="(v: any) => emitChange(v)"
    />
    <a-select
      v-else-if="component.type === 'Select'"
      :value="innerValue"
      :options="component.options"
      :placeholder="component.props?.placeholder || '请选择'"
      :disabled="disabled"
      :style="{ width: component.inputWidth ? component.inputWidth + 'px' : '100%' }"
      @update:value="(v: any) => emitChange(v)"
      allow-clear
    />
    <a-radio-group
      v-else-if="component.type === 'RadioGroup'"
      :value="innerValue"
      :disabled="disabled"
      @update:value="(v: any) => emitChange(v)"
    >
      <a-radio
        v-for="o in component.options"
        :key="o.value"
        :value="o.value"
      >{{ o.label }}</a-radio>
    </a-radio-group>
    <a-checkbox-group
      v-else-if="component.type === 'CheckboxGroup'"
      :value="innerValue || []"
      :disabled="disabled"
      @update:value="(v: any) => emitChange(v)"
    >
      <a-checkbox
        v-for="o in component.options"
        :key="o.value"
        :value="o.value"
      >{{ o.label }}</a-checkbox>
    </a-checkbox-group>
    <a-date-picker
      v-else-if="component.type === 'DatePicker'"
      :value="innerValue"
      :format="component.props?.format"
      :disabled="disabled"
      :style="{ width: component.inputWidth ? component.inputWidth + 'px' : '100%' }"
      @update:value="(v: any) => emitChange(v)"
    />
    <a-time-picker
      v-else-if="component.type === 'TimePicker'"
      :value="innerValue"
      :format="component.props?.format"
      :disabled="disabled"
      :style="{ width: component.inputWidth ? component.inputWidth + 'px' : '100%' }"
      @update:value="(v: any) => emitChange(v)"
    />
    <a-switch
      v-else-if="component.type === 'Switch'"
      :checked="!!innerValue"
      :disabled="disabled"
      @update:checked="(v: any) => emitChange(v)"
    />
    <div v-else-if="component.type === 'DisplayText'" class="display-text" :style="dynamicStyle">
      {{ component.props?.prefix || '' }}{{ innerValue ?? '[计算结果将在这里展示]' }}{{ suffixText || component.props?.suffix || '' }}
    </div>

    <span v-if="showUnit !== false && component.unit && component.type !== 'DisplayText'" class="unit text-muted">{{ component.unit }}</span>
    <span v-if="suffixText && component.type !== 'DisplayText'" class="suffix-tag">{{ suffixText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentDef } from '@/types/template'

const props = defineProps<{
  component: ComponentDef
  value?: any
  disabled?: boolean
  suffixText?: string
  dynamicStyle?: Record<string, string>
  classes?: string[]
  /**
   * 是否在控件后显示单位（renderer 模式下隐藏，因为单位已在独立列展示）
   */
  showUnit?: boolean
}>()

const emit = defineEmits<{
  change: [value: any]
}>()

const innerValue = computed(() => props.value !== undefined ? props.value : props.component.defaultValue)

const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.component.fontColor) style.color = props.component.fontColor
  if (props.component.fontSize) style.fontSize = props.component.fontSize + 'px'
  // 规则副作用动态样式：容器颜色 + CSS 变量穿透到输入框
  if (props.dynamicStyle) {
    Object.assign(style, props.dynamicStyle)
    if (props.dynamicStyle.color) style['--vf-dynamic-color'] = props.dynamicStyle.color
  }
  return style
})

const emitChange = (v: any) => {
  emit('change', v)
}
</script>

<style scoped>
.field-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
/* 规则副作用（阈值/比较）设置的字体颜色穿透到输入框内部 */
.field-preview :deep(.ant-input),
.field-preview :deep(.ant-input-number-input) {
  color: var(--vf-dynamic-color, inherit);
}
.field-preview .unit {
  font-size: 13px;
}
.display-text {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-weight: 500;
  flex: 1;
}
/* 比较规则副作用：异常时加红框 */
:global(.is-abnormal) {
  border: 2px solid #f5222d;
  border-radius: 6px;
  padding: 4px 8px;
}
.suffix-tag {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #fff1f0;
  color: #f5222d;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>