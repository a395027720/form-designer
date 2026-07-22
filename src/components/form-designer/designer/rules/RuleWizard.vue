<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentDef, RuleDef, RuleType } from '../../types'
import { uid } from '../../utils/uid'
import { describeRule } from '../../utils/describe'
import CalculationRuleEditor from './CalculationRuleEditor.vue'
import ThresholdRuleEditor from './ThresholdRuleEditor.vue'
import ComparisonRuleEditor from './ComparisonRuleEditor.vue'
import ConditionalRuleEditor from './ConditionalRuleEditor.vue'
import ValidationRuleEditor from './ValidationRuleEditor.vue'

export type WizardMode = 'create' | 'edit'

const props = defineProps<{
  open: boolean
  component: ComponentDef
  components: ComponentDef[]
  ruleTypeFilter?: RuleType[]
  mode?: WizardMode
  editRule?: RuleDef | null
  /** 只读模式：仅查看规则详情，禁用编辑与保存（presets 模式用） */
  readonly?: boolean
}>()
const emit = defineEmits<{
  'update:open': [boolean]
  confirm: [RuleDef, WizardMode]
}>()

const step = ref(0)
const chosenType = ref<RuleType | null>(null)
const targetCompId = ref<string>(props.component.id)
const draftRule = ref<RuleDef>(makeDraft('validation'))
const activeMode = computed<WizardMode>(() => props.mode || 'create')

const selfId = computed(() => props.component.id)

const title = computed(() => {
  const prefix = props.readonly ? '查看规则' : (activeMode.value === 'edit' ? '编辑规则' : '新增规则')
  return chosenType.value ? `${prefix} - ${getLabel(chosenType.value)}` : prefix
})

const allTypes = [
  { type: 'threshold' as RuleType, label: '阈值分级', icon: '📊', desc: '如白细胞 < 4 偏低、4-10 正常、> 10 偏高' },
  { type: 'calculation' as RuleType, label: '计算', icon: '🧮', desc: '根据其他字段计算当前字段值' },
  { type: 'comparison' as RuleType, label: '比较', icon: '⚖️', desc: '与阈值比较，如血糖 > 7.0 时高亮' },
  { type: 'conditional' as RuleType, label: '条件显隐', icon: '👁️', desc: '如性别为女时显示妊娠项' },
  { type: 'validation' as RuleType, label: '校验', icon: '✅', desc: '必填、数值范围、长度限制等' }
]

const availableTypes = computed(() => {
  const filter = props.ruleTypeFilter
  return filter ? allTypes.filter(t => filter.includes(t.type)) : allTypes
})

const needsTargetStep = () => false
const singleType = computed<RuleType | null>(() =>
  availableTypes.value.length === 1 ? availableTypes.value[0].type : null
)

const activeSteps = computed<number[]>(() => {
  const steps: number[] = []
  if (!singleType.value) steps.push(0)
  if (needsTargetStep()) steps.push(1)
  steps.push(2, 3)
  return steps
})

const STEP_TITLES: Record<number, string> = { 0: '类型', 1: '触发', 2: '参数', 3: '副作用/预览' }
const stepTitles = computed(() => activeSteps.value.map(s => STEP_TITLES[s]))
const displayStep = computed(() => Math.max(0, activeSteps.value.indexOf(step.value)))

const editorMap: Record<RuleType, any> = {
  calculation: CalculationRuleEditor,
  threshold: ThresholdRuleEditor,
  comparison: ComparisonRuleEditor,
  conditional: ConditionalRuleEditor,
  validation: ValidationRuleEditor
}

const getLabel = (t: RuleType) => allTypes.find(x => x.type === t)?.label || t

function makeDraft(type: RuleType): RuleDef {
  let params: any = {}
  if (type === 'validation') {
    params = { validators: [] }
  } else if (type === 'threshold') {
    params = { ranges: [], actions: [] }
  } else if (type === 'comparison') {
    params = { operator: '>', left: '', right: '', actions: [] }
  } else if (type === 'conditional') {
    params = {
      when: { operator: '==', left: '', right: { type: 'constant', value: '' } },
      then: { type: 'show', target: '' },
      else: { type: 'hidden', target: '' }
    }
  }
  return {
    id: uid('rule_'),
    type,
    name: '新规则',
    enabled: true,
    trigger: type === 'validation' ? 'onBlur' : 'onChange',
    params
  }
}

const onChooseType = (t: RuleType) => {
  chosenType.value = t
  draftRule.value = makeDraft(t)
  targetCompId.value = props.component.id
  step.value = 2
}

const nextStep = () => {
  const i = activeSteps.value.indexOf(step.value)
  if (i >= 0 && i < activeSteps.value.length - 1) step.value = activeSteps.value[i + 1]
}
const prevStep = () => {
  const i = activeSteps.value.indexOf(step.value)
  if (i > 0) step.value = activeSteps.value[i - 1]
}

const minStep = computed(() => (activeMode.value === 'edit' ? 2 : activeSteps.value[0]))
const canNext = computed(() => {
  if (step.value === 0) return !!chosenType.value
  if (step.value === 1) return !!targetCompId.value
  return true
})

const onCancel = () => {
  emit('update:open', false)
  setTimeout(() => {
    step.value = 0
    chosenType.value = null
  }, 200)
}

const onConfirm = () => {
  emit('confirm', JSON.parse(JSON.stringify(draftRule.value)), activeMode.value)
  onCancel()
}

watch(() => props.open, (v) => {
  if (!v) return
  if (props.mode === 'edit' && props.editRule) {
    chosenType.value = props.editRule.type
    targetCompId.value = props.component.id
    draftRule.value = JSON.parse(JSON.stringify(props.editRule))
    step.value = 2
  } else {
    targetCompId.value = props.component.id
    if (singleType.value) {
      chosenType.value = singleType.value
      draftRule.value = makeDraft(singleType.value)
      step.value = needsTargetStep() ? 1 : 2
    } else {
      step.value = 0
      chosenType.value = null
      draftRule.value = makeDraft('validation')
    }
  }
})
</script>

<template>
  <a-modal
    :open="open"
    :title="title"
    width="560"
    :footer="null"
    :mask-closable="false"
    @update:open="(v: boolean) => emit('update:open', v)"
    @cancel="onCancel"
  >
    <div class="wizard" :class="{ 'wizard-readonly': readonly }">
      <!-- 步骤条 -->
      <a-steps :current="displayStep + 1" size="small" class="wizard-steps">
        <a-step v-for="t in stepTitles" :key="t" :title="t" />
      </a-steps>

      <!-- Step 1: 类型选择 -->
      <div v-if="step === 0 && mode === 'create'" class="step-body">
        <p class="text-muted">请选择要配置的规则类型：</p>
        <div class="type-grid">
          <div
            v-for="t in availableTypes"
            :key="t.type"
            class="type-card"
            :class="{ selected: chosenType === t.type }"
            @click="onChooseType(t.type)"
          >
            <div class="type-icon">{{ t.icon }}</div>
            <div class="type-label">{{ t.label }}</div>
            <div class="type-desc text-muted">{{ t.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Step 2: 触发字段 -->
      <div v-else-if="step === 1 && mode === 'create'" class="step-body">
        <p class="text-muted">这条规则影响哪个字段？</p>
        <a-radio-group v-model:value="targetCompId" class="radio-list">
          <a-radio
            v-for="c in components"
            :key="c.id"
            :value="c.id"
            :disabled="chosenType === 'conditional' && c.id === selfId"
            class="radio-item"
          >
            {{ c.label }} <span class="text-muted">({{ c.type }})</span>
          </a-radio>
        </a-radio-group>
      </div>

      <!-- Step 3: 参数编辑 -->
      <div v-else-if="step === 2" class="step-body">
        <component
          :is="editorMap[chosenType!]"
          :components="components"
          :self-id="targetCompId"
          v-model:rule="draftRule"
        />
      </div>

      <!-- Step 4: 预览 -->
      <div v-else-if="step === 3" class="step-body">
        <div v-if="chosenType !== 'validation' && chosenType !== 'conditional'" class="info-banner">
          规则保存后会自动在右侧属性标签页中显示
        </div>
        <div class="preview-card">
          <p class="preview-text">{{ describeRule(draftRule, components) }}</p>
        </div>

        <a-form layout="vertical" size="small">
          <a-form-item label="规则名称">
            <a-input :value="draftRule.name" @update:value="(v: any) => draftRule.name = v" />
          </a-form-item>
          <a-form-item>
            <a-checkbox :checked="draftRule.enabled" @update:checked="(v: any) => draftRule.enabled = v">
              启用此规则
            </a-checkbox>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <div class="wizard-footer">
      <a-space>
        <a-button v-if="step > minStep" @click="prevStep">上一步</a-button>
        <a-button v-if="step < 3" type="primary" :disabled="!canNext" @click="nextStep">下一步</a-button>
        <a-button v-else-if="!readonly" type="primary" @click="onConfirm">完成</a-button>
        <a-button @click="onCancel">{{ readonly ? '关闭' : '取消' }}</a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<style scoped>
.wizard {
  padding: 8px 0;
}
/* 只读模式：内容区仅供查看，禁止交互（步骤导航仍可用） */
.wizard-readonly .step-body {
  pointer-events: none;
  opacity: 0.85;
}
.wizard-steps {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.step-body {
  min-height: 280px;
  padding: 24px 8px;
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.type-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.type-card:hover {
  border-color: #1677ff;
  background: #f0f7ff;
}
.type-card.selected {
  border-color: #1677ff;
  background: #e6f4ff;
}
.type-icon { font-size: 32px; margin-bottom: 8px; }
.type-label { font-weight: 600; margin-bottom: 4px; }
.type-desc { font-size: 12px; line-height: 1.4; }
.radio-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}
.info-banner {
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 6px;
  font-size: 13px;
  color: #1677ff;
}
.preview-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
  margin-bottom: 16px;
}
.preview-text {
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}
.wizard-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.text-muted { color: #94a3b8; }
</style>
