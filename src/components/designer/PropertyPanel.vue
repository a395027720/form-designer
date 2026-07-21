<template>
  <div class="property-panel">
    <a-tabs v-model:activeKey="activeTab" size="small">
        <!-- 基础属性 -->
        <a-tab-pane key="basic" tab="基础">
          <div class="pp-scroll">
            <!-- 卡片 1：标签与字段 -->
            <div class="pp-card">
              <div class="pp-card-title">标签与字段</div>
              <div class="pp-form">
                <div class="pp-field">
                  <label class="pp-label">标签 (label)</label>
                  <a-input v-model:value="component.label" />
                </div>
                <div class="pp-field">
                  <label class="pp-label">字段名 (field)</label>
                  <a-input v-model:value="component.field" />
                </div>
                <div v-if="showUnit" class="pp-field">
                  <label class="pp-label">单位</label>
                  <a-input v-model:value="component.unit" placeholder="如 10^9/L" />
                </div>
                <div class="pp-field">
                  <label class="pp-label">默认值</label>
                  <a-input v-model:value="defaultValueStr" placeholder="留空表示无" />
                </div>
                <div class="pp-field pp-field-inline">
                  <a-checkbox v-model:checked="component.required">必填</a-checkbox>
                </div>
              </div>
            </div>

            <!-- 卡片 2：组件属性 -->
            <div class="pp-card">
              <div class="pp-card-title">组件属性</div>
              <div class="pp-form">
                <div class="pp-field">
                  <label class="pp-label">字体颜色</label>
                  <div class="pp-color-row">
                    <input type="color" class="pp-color-picker" v-model="component.fontColor" />
                    <a-input v-model:value="component.fontColor" placeholder="如 #1677ff" allow-clear style="flex: 1" />
                  </div>
                </div>
                <div class="pp-field">
                  <label class="pp-label">字体大小</label>
                  <a-input-number
                    v-model:value="component.fontSize"
                    :min="10"
                    :max="48"
                    :step="1"
                    placeholder="留空则默认"
                    addon-after="px"
                    style="width: 100%"
                  />
                </div>

                <!-- Input -->
                <template v-if="component.type === 'Input'">
                  <div class="pp-field">
                    <label class="pp-label">占位提示</label>
                    <a-input v-model:value="component.props.placeholder" />
                  </div>
                  <div class="pp-field">
                    <label class="pp-label">最大长度</label>
                    <a-input-number v-model:value="component.props.maxLength" :min="1" style="width: 100%" />
                  </div>
                </template>

                <!-- InputNumber -->
                <template v-if="component.type === 'InputNumber'">
                  <div class="pp-field">
                    <label class="pp-label">最小值</label>
                    <a-input-number v-model:value="component.props.min" style="width: 100%" />
                  </div>
                  <div class="pp-field">
                    <label class="pp-label">最大值</label>
                    <a-input-number v-model:value="component.props.max" style="width: 100%" />
                  </div>
                  <div class="pp-field">
                    <label class="pp-label">小数位数</label>
                    <a-input-number v-model:value="component.props.precision" :min="0" :max="6" style="width: 100%" />
                  </div>
                  <div class="pp-field">
                    <label class="pp-label">占位提示</label>
                    <a-input-number v-model:value="component.props.placeholder" />
                  </div>
                </template>

                <!-- Select -->
                <template v-if="component.type === 'Select'">
                  <div class="pp-field">
                    <label class="pp-label">占位提示</label>
                    <a-input v-model:value="component.props.placeholder" />
                  </div>
                  <div class="pp-field">
                    <label class="pp-label">选项</label>
                    <OptionEditor v-model:value="component.options" />
                  </div>
                </template>

                <!-- Radio / Checkbox -->
                <template v-if="component.type === 'RadioGroup' || component.type === 'CheckboxGroup'">
                  <div class="pp-field">
                    <label class="pp-label">选项</label>
                    <OptionEditor v-model:value="component.options" />
                  </div>
                </template>

                <!-- Textarea -->
                <template v-if="component.type === 'Textarea'">
                  <div class="pp-field">
                    <label class="pp-label">行数</label>
                    <a-input-number v-model:value="component.props.rows" :min="2" :max="20" style="width: 100%" />
                  </div>
                  <div class="pp-field">
                    <label class="pp-label">占位提示</label>
                    <a-input v-model:value="component.props.placeholder" />
                  </div>
                </template>

                <!-- DatePicker / TimePicker -->
                <template v-if="component.type === 'DatePicker' || component.type === 'TimePicker'">
                  <div class="pp-field">
                    <label class="pp-label">格式</label>
                    <a-input v-model:value="component.props.format" placeholder="如 YYYY-MM-DD" />
                  </div>
                </template>

                <!-- DisplayText -->
                <template v-if="component.type === 'DisplayText'">
                  <div class="pp-field">
                    <label class="pp-label">前缀文案</label>
                    <a-input v-model:value="component.props.prefix" />
                  </div>
                  <div class="pp-field">
                    <label class="pp-label">后缀文案</label>
                    <a-input v-model:value="component.props.suffix" />
                  </div>
                </template>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 校验规则 -->
        <a-tab-pane key="validation" tab="校验">
          <RuleList type="validation" :component="component" />
        </a-tab-pane>

        <!-- 业务规则 -->
        <a-tab-pane key="business" tab="业务规则">
          <RuleList type="business" :component="component" />
        </a-tab-pane>
      </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@/stores/templateStore'
import type { ComponentDef, ComponentType } from '@/types/template'
import { findComponentById } from '@/utils/componentTree'
import OptionEditor from './OptionEditor.vue'
import RuleList from './rules/RuleList.vue'

const store = useTemplateStore()
const { template, selectedComponentId } = storeToRefs(store)
const activeTab = ref('basic')

// 用 storeToRefs 解构出响应式 ref，computed 能正确 track
const component = computed<ComponentDef | null>(() => {
  if (!template.value || !selectedComponentId.value) return null
  return findComponentById(template.value.components, selectedComponentId.value)
})
console.log('[init] template:', template.value?.id, 'selectedId:', selectedComponentId.value)

const showUnit = computed(() => {
  if (!component.value) return false
  return ['Input', 'InputNumber', 'DisplayText', 'Textarea'].includes(component.value.type)
})

// 有"输入框"形态的组件：宽度可单独设置
const hasInputControl = computed(() => {
  if (!component.value) return false
  return ['Input', 'Textarea', 'InputNumber', 'Select', 'DatePicker', 'TimePicker'].includes(component.value.type)
})

const defaultValueStr = ref<string>('')
watch(component, (c) => {
  if (!c) return
  // 防御：旧模板可能没有 props 字段，初始化避免模板渲染报错
  if (!c.props) c.props = {} as any
  defaultValueStr.value = c.defaultValue === undefined || c.defaultValue === null
    ? ''
    : String(c.defaultValue)
}, { immediate: true })

watch(defaultValueStr, (v) => {
  if (!component.value) return
  if (v === '' || v === undefined) {
    component.value.defaultValue = undefined
  } else {
    const num = Number(v)
    component.value.defaultValue = !isNaN(num) && v.trim() !== '' ? num : v
  }
})

</script>

<style scoped>
.property-panel {
  --pp-card-bg: #ffffff;
  --pp-card-border: #e5e7eb;
  --pp-card-radius: 8px;
  --pp-card-padding: 16px;
  --pp-card-gap: 12px;
  --pp-card-title-bg: #f0f5ff;
  --pp-card-title-color: #1677ff;
  --pp-label-color: #6b7280;
  --pp-field-gap: 14px;
  --pp-primary: #1677ff;

  height: 100%;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 滚动区域：flex 撑满父级，溢出时滚动 */
.pp-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: var(--pp-card-gap);
}

/* 卡片 */
.pp-card {
  background: var(--pp-card-bg);
  border: 1px solid var(--pp-card-border);
  border-radius: var(--pp-card-radius);
  padding: var(--pp-card-padding);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 卡片标题（蓝底蓝字 chip） */
.pp-card-title {
  display: inline-block;
  align-self: flex-start;
  font-size: 12px;
  line-height: 20px;
  color: var(--pp-card-title-color);
  background: var(--pp-card-title-bg);
  padding: 0 8px;
  border-radius: 4px;
  font-weight: 600;
  margin-bottom: 2px;
}

/* form 内部 */
.pp-form {
  display: flex;
  flex-direction: column;
  gap: var(--pp-field-gap);
}

/* 单个字段 */
.pp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pp-field-inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.pp-field :deep(.ant-input-affix-wrapper),
.pp-field :deep(.ant-input),
.pp-field :deep(.ant-input-number),
.pp-field :deep(.ant-select) {
  width: 100%;
}

/* 字段标签 */
.pp-label {
  font-size: 12px;
  color: var(--pp-label-color);
  line-height: 1.5;
}

/* 提示文字 */
.pp-hint {
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.5;
}

/* 颜色选择器：原生 input[type=color] + 文字输入组合 */
.pp-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pp-color-picker {
  width: 36px;
  height: 32px;
  padding: 2px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  flex-shrink: 0;
}

/* 空状态卡片 */
.pp-empty {
  background: var(--pp-card-bg);
  border: 1px solid var(--pp-card-border);
  border-radius: var(--pp-card-radius);
  padding: 24px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* tab 区域：让 tab 占满高度 + 滚动区占满 */
:deep(.ant-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.ant-tabs-nav) {
  height: 48px;
  box-sizing: border-box;
  padding: 0 12px;
  margin: 0;
  background: #ffffff;
}
:deep(.ant-tabs-content-holder) {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
:deep(.ant-tabs-content) {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
:deep(.ant-tabs-tabpane-active) {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* tab 激活态：底部 2px 蓝条 + 文字加粗 */
:deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  font-weight: 600;
  color: var(--pp-primary);
}
:deep(.ant-tabs-ink-bar) {
  background: var(--pp-primary) !important;
  height: 2px !important;
  bottom: 1px !important;
}
:deep(.ant-tabs-nav::before) {
  border-color: #f0f0f0 !important;
}

/* slider 标记文字 */
:deep(.ant-slider-mark-text) {
  font-size: 11px;
}
</style>
