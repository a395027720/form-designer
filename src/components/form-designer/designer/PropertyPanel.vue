<script setup lang="ts">
/**
 * 字段属性面板（basic/field mode 共用）
 * - 基础标签页：标签、字段、单位、默认值、字体、组件级参数
 * - 校验 / 业务规则 通过 RuleList 复用
 * - UI 全部用 antd
 */
import { computed, ref, watch } from 'vue'
import type { ComponentDef, RuleDef, SelectOption } from '../types'
import { RuleList } from './rules'
import OptionsEditor from './OptionsEditor.vue'

interface Props {
  component: ComponentDef
  components?: ComponentDef[]
  /** 整个属性面板只读，仅可查看不可编辑（presets 模式用） */
  readonlyFields?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:component', value: ComponentDef): void
  (e: 'addRule', componentId: string, rule: RuleDef): void
  (e: 'updateRule', componentId: string, ruleId: string, patch: Partial<RuleDef>): void
  (e: 'removeRule', componentId: string, ruleId: string): void
}>()

const activeTab = ref('basic')

function update(patch: Partial<ComponentDef>) {
  emit('update:component', { ...props.component, ...patch })
}

function updateProps(propPatch: Record<string, any>) {
  const merged = { ...(props.component.props || {}), ...propPatch }
  update({ props: merged })
}

// 默认值双向绑定
const defaultValueStr = ref('')
watch(() => props.component, (c) => {
  if (!c) return
  defaultValueStr.value = c.defaultValue === undefined || c.defaultValue === null ? '' : String(c.defaultValue)
}, { immediate: true })
watch(defaultValueStr, (v) => {
  if (v === '') update({ defaultValue: undefined })
  else if (!isNaN(Number(v))) update({ defaultValue: Number(v) })
  else update({ defaultValue: v })
})

const showUnit = computed(() => ['Input', 'InputNumber', 'DisplayText', 'Textarea'].includes(props.component.type))
const showOptions = computed(() => ['Select', 'RadioGroup', 'CheckboxGroup'].includes(props.component.type))

function onApiChange(v: string) {
  update({ api: v || undefined })
}

function onOptionsChange(opts: SelectOption[]) {
  update({ options: opts })
}

function onLabelChange(v: string) { update({ label: v }) }
function onFieldChange(v: string) { update({ field: v }) }
function onUnitChange(v: string) { update({ unit: v }) }
function onRequiredChange(v: boolean) { update({ required: v }) }
function onFontColorChange(v: string) { update({ fontColor: v || undefined }) }
function onFontSizeChange(v: number | null) { update({ fontSize: v ?? undefined }) }
function onInputWidthChange(v: number | null) { update({ inputWidth: v ?? undefined }) }
</script>

<template>
  <div class="fd-property-panel">
    <a-tabs v-model:activeKey="activeTab" class="pp-tabs-wrap">
      <a-tab-pane key="basic" tab="基础" />
      <a-tab-pane key="validation" tab="校验" />
      <a-tab-pane key="rules" tab="业务规则" />
    </a-tabs>

    <div class="pp-scroll">
      <!-- 基础属性 -->
      <div v-if="activeTab === 'basic'">
        <!-- 标签与字段 -->
        <div class="pp-card">
          <div class="pp-card-title">标签与字段</div>
          <div class="pp-form">
            <div class="pp-field">
              <label class="pp-label">标签 (label)</label>
              <a-input :value="component.label" :disabled="readonlyFields" @update:value="onLabelChange" />
            </div>
            <div class="pp-field">
              <label class="pp-label">字段名 (field)</label>
              <a-input :value="component.field" :disabled="readonlyFields" @update:value="onFieldChange" />
            </div>
            <div v-if="showUnit" class="pp-field">
              <label class="pp-label">单位</label>
              <a-input :value="component.unit ?? ''" :disabled="readonlyFields" placeholder="如 10^9/L" @update:value="onUnitChange" />
            </div>
            <div class="pp-field">
              <label class="pp-label">默认值</label>
              <a-input :value="defaultValueStr" :disabled="readonlyFields" placeholder="留空表示无" @update:value="(v: string) => defaultValueStr = v" />
            </div>
            <div class="pp-field pp-field-inline">
              <a-checkbox :checked="!!component.required" :disabled="readonlyFields" @update:checked="onRequiredChange">必填</a-checkbox>
            </div>
          </div>
        </div>

        <!-- 组件属性 -->
        <div class="pp-card">
          <div class="pp-card-title">组件属性</div>
          <div class="pp-form">
            <div class="pp-field">
              <label class="pp-label">字体颜色</label>
              <div class="pp-color-row">
                <input type="color" class="pp-color-picker" :value="component.fontColor ?? '#000000'" :disabled="readonlyFields" @input="(e: any) => onFontColorChange(e.target.value)" />
                <a-input :value="component.fontColor ?? ''" :disabled="readonlyFields" placeholder="如 #1677ff" @update:value="onFontColorChange" />
              </div>
            </div>
            <div class="pp-field">
              <label class="pp-label">字体大小 (px)</label>
              <a-input-number :value="component.fontSize ?? null" :disabled="readonlyFields" :min="10" :max="48" style="width: 100%" @update:value="onFontSizeChange" />
            </div>
            <div class="pp-field">
              <label class="pp-label">输入框宽度 (px)</label>
              <a-input-number :value="component.inputWidth ?? null" :disabled="readonlyFields" :min="50" :max="800" placeholder="留空则100%" style="width: 100%" @update:value="onInputWidthChange" />
            </div>

            <!-- Input -->
            <template v-if="component.type === 'Input'">
              <div class="pp-field">
                <label class="pp-label">最大长度</label>
                <a-input-number :value="component.props?.maxLength ?? null" :disabled="readonlyFields" :min="1" style="width: 100%" @update:value="(v: number | null) => updateProps({ maxLength: v })" />
              </div>
            </template>

            <!-- InputNumber -->
            <template v-if="component.type === 'InputNumber'">
              <div class="pp-field">
                <label class="pp-label">最小值</label>
                <a-input-number :value="component.props?.min ?? null" :disabled="readonlyFields" style="width: 100%" @update:value="(v: number | null) => updateProps({ min: v })" />
              </div>
              <div class="pp-field">
                <label class="pp-label">最大值</label>
                <a-input-number :value="component.props?.max ?? null" :disabled="readonlyFields" style="width: 100%" @update:value="(v: number | null) => updateProps({ max: v })" />
              </div>
              <div class="pp-field">
                <label class="pp-label">小数位数</label>
                <a-input-number :value="component.props?.precision ?? null" :disabled="readonlyFields" :min="0" :max="6" style="width: 100%" @update:value="(v: number | null) => updateProps({ precision: v })" />
              </div>
            </template>

            <!-- Select -->
            <!-- Select / RadioGroup / CheckboxGroup 共享选项编辑 -->
            <template v-if="showOptions">
              <div class="pp-field">
                <label class="pp-label">接口地址</label>
                <a-input
                  :value="component.api ?? ''"
                  :disabled="readonlyFields"
                  placeholder="选填，如 /api/dict/items?type=gender"
                  @update:value="onApiChange"
                />
              </div>
              <div class="pp-field">
                <label class="pp-label">选项列表</label>
                <OptionsEditor
                  :options="component.options ?? []"
                  :disabled="readonlyFields"
                  @update:options="onOptionsChange"
                />
              </div>
            </template>

            <!-- Textarea -->
            <template v-if="component.type === 'Textarea'">
              <div class="pp-field">
                <label class="pp-label">行数</label>
                <a-input-number :value="component.props?.rows ?? 4" :disabled="readonlyFields" :min="2" :max="20" style="width: 100%" @update:value="(v: number | null) => updateProps({ rows: v })" />
              </div>
            </template>

            <!-- DatePicker / TimePicker -->
            <template v-if="component.type === 'DatePicker' || component.type === 'TimePicker'">
              <div class="pp-field">
                <label class="pp-label">格式</label>
                <a-input :value="component.props?.format ?? ''" :disabled="readonlyFields" placeholder="如 YYYY-MM-DD" @update:value="(v: string) => updateProps({ format: v })" />
              </div>
            </template>

            <!-- DisplayText -->
            <template v-if="component.type === 'DisplayText'">
              <div class="pp-field">
                <label class="pp-label">前缀文案</label>
                <a-input :value="component.props?.prefix ?? ''" :disabled="readonlyFields" @update:value="(v: string) => updateProps({ prefix: v })" />
              </div>
              <div class="pp-field">
                <label class="pp-label">后缀文案</label>
                <a-input :value="component.props?.suffix ?? ''" :disabled="readonlyFields" @update:value="(v: string) => updateProps({ suffix: v })" />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 校验规则 -->
      <div v-else-if="activeTab === 'validation'" class="pp-tab-content">
        <RuleList
          :component="component"
          :components="components ?? []"
          type="validation"
          :readonly="readonlyFields"
          @addRule="(cid, r) => emit('addRule', cid, r)"
          @updateRule="(cid, rid, p) => emit('updateRule', cid, rid, p)"
          @removeRule="(cid, rid) => emit('removeRule', cid, rid)"
        />
      </div>

      <!-- 业务规则 -->
      <div v-else-if="activeTab === 'rules'" class="pp-tab-content">
        <RuleList
          :component="component"
          :components="components ?? []"
          type="business"
          :readonly="readonlyFields"
          @addRule="(cid, r) => emit('addRule', cid, r)"
          @updateRule="(cid, rid, p) => emit('updateRule', cid, rid, p)"
          @removeRule="(cid, rid) => emit('removeRule', cid, rid)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fd-property-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e5e7eb;
}
.pp-tabs-wrap {
  flex-shrink: 0;
  padding: 0 12px;
  background: #fafbfc;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
/* 美化 tab 标签：默认 antd 的 tab 视觉略粗，调成细而干净 */
.pp-tabs-wrap :deep(.ant-tabs-nav) {
  margin: 0;
}
.pp-tabs-wrap :deep(.ant-tabs-tab) {
  padding: 8px 4px;
  margin: 0 12px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary, #6b7280);
  transition: color 0.2s;
}
.pp-tabs-wrap :deep(.ant-tabs-tab:hover) {
  color: var(--color-primary, #1677ff);
}
.pp-tabs-wrap :deep(.ant-tabs-tab-active) {
  color: var(--color-primary, #1677ff);
  font-weight: 600;
}
/* 内容区紧贴 tabs，给 scroll 一个干净的边界 */
.pp-tabs-wrap :deep(.ant-tabs-content-holder) {
  display: none;
}
.pp-scroll {
  flex: 1;
  overflow-y: auto;
}
.pp-card {
  margin: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.pp-card-title {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}
.pp-form {
  padding: 8px 12px 12px;
}
.pp-field {
  margin-bottom: 12px;
}
.pp-field:last-child {
  margin-bottom: 0;
}
.pp-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #64748b;
}
.pp-field-inline {
  display: flex;
  align-items: center;
}
.pp-color-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.pp-color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
}
.pp-tab-content {
  padding: 12px;
}
</style>
