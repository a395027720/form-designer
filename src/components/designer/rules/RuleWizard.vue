<template>
  <a-modal
    :open="open"
    :title="title"
    width="780px"
    :footer="null"
    @cancel="onCancel"
    @ok="onCancel"
  >
    <div class="wizard">
      <a-steps :current="displayStep" size="small">
        <a-step v-for="t in stepTitles" :key="t" :title="t" />
      </a-steps>

      <!-- Step 1 -->
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

      <!-- Step 2 -->
      <div v-else-if="step === 1 && mode === 'create'" class="step-body">
        <p class="text-muted">这条规则影响哪个字段？</p>
        <a-radio-group v-model:value="targetCompId" style="display: flex; flex-direction: column; gap: 8px">
          <a-radio
            v-for="c in components"
            :key="c.id"
            :value="c.id"
            :disabled="chosenType === 'conditional' && c.id === selfId"
          >
            {{ c.label }} <span class="text-muted">({{ c.type }})</span>
          </a-radio>
        </a-radio-group>
        <p class="text-muted" style="margin-top: 16px; font-size: 12px">
          💡 选中字段意味着：当该字段被赋值时（或值变化时）规则会触发
        </p>
      </div>

      <!-- Step 3 -->
      <div v-else-if="step === 2" class="step-body">
        <component
          :is="editorMap[chosenType!]"
          :components="otherComponents"
          :self-id="targetCompId"
          v-model:rule="draftRule"
        />
      </div>

      <!-- Step 4 -->
      <div v-else-if="step === 3" class="step-body">
        <a-alert
          v-if="chosenType !== 'validation' && chosenType !== 'conditional'"
          type="info"
          style="margin-bottom: 12px"
          message="下一步：规则保存后会自动在右侧【基础属性】的标签页中显示"
        />
        <a-card title="规则预览" size="small">
          <p style="font-size: 14px; line-height: 1.8; margin: 0">
            {{ describeRule(draftRule, components) }}
          </p>
        </a-card>

        <a-form-item label="规则名称" style="margin-top: 16px">
          <a-input v-model:value="draftRule.name" />
        </a-form-item>

        <a-checkbox v-model:checked="draftRule.enabled">启用此规则</a-checkbox>
      </div>

      <div class="wizard-footer">
        <a-button v-if="step > minStep" @click="prevStep">上一步</a-button>
        <a-button v-if="step < 3" type="primary" :disabled="!canNext" @click="nextStep">
          下一步
        </a-button>
        <a-button v-else type="primary" @click="onConfirm">完成</a-button>
        <a-button @click="onCancel">取消</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentDef, RuleDef, RuleType } from '@/types/template'
import { uid } from '@/utils/uid'
import { describeRule } from '@/utils/describe'
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

const otherComponents = computed(() =>
  props.components.filter(c => c.id !== targetCompId.value)
)

const title = computed(() => {
  const prefix = activeMode.value === 'edit' ? '编辑规则' : '新增规则'
  return chosenType.value ? `${prefix} - ${getLabel(chosenType.value)}` : prefix
})

const allTypes = [
  { type: 'threshold' as RuleType, label: '阈值分级', icon: '📊', desc: '如白细胞 < 4 偏低、4-10 正常、> 10 偏高' },
  { type: 'calculation' as RuleType, label: '计算', icon: '🧮', desc: '根据其他字段计算当前字段值，如 a + b / 2' },
  { type: 'comparison' as RuleType, label: '比较', icon: '⚖️', desc: '与阈值比较，如血糖 > 7.0 时高亮' },
  { type: 'conditional' as RuleType, label: '条件显隐', icon: '👁️', desc: '如性别为女时显示妊娠项' },
  { type: 'validation' as RuleType, label: '校验', icon: '✅', desc: '必填、数值范围、长度限制等' }
]

const availableTypes = computed(() => {
  const filter = props.ruleTypeFilter
  return filter ? allTypes.filter(t => filter.includes(t.type)) : allTypes
})

// 所有规则都作用于当前选中的字段自身，无需「触发/选组件」步骤
const needsTargetStep = () => false

// 类型候选只有一种时（如从「新增校验」入口进入），自动选中并跳过「类型」步
const singleType = computed<RuleType | null>(() =>
  availableTypes.value.length === 1 ? availableTypes.value[0].type : null
)

// 当前场景实际经过的内部 step 序列（0类型 / 1触发 / 2参数 / 3预览）
const activeSteps = computed<number[]>(() => {
  const steps: number[] = []
  if (!singleType.value) steps.push(0)        // 类型步：仅当有多种可选
  if (needsTargetStep(chosenType.value)) steps.push(1) // 触发步：仅业务规则
  steps.push(2, 3)                             // 参数、预览
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
  // 选完类型后直接进入参数编辑
  step.value = 2
}

// 沿当前场景的 activeSteps 序列前后移动
const nextStep = () => {
  const i = activeSteps.value.indexOf(step.value)
  if (i >= 0 && i < activeSteps.value.length - 1) step.value = activeSteps.value[i + 1]
}
const prevStep = () => {
  const i = activeSteps.value.indexOf(step.value)
  if (i > 0) step.value = activeSteps.value[i - 1]
}

// 上一步可回退的最小步骤：编辑模式停在参数步(2)，否则为序列首步
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
      // 类型候选唯一，自动选中并跳过「类型」步
      chosenType.value = singleType.value
      draftRule.value = makeDraft(singleType.value)
      step.value = needsTargetStep(singleType.value) ? 1 : 2
    } else {
      step.value = 0
      chosenType.value = null
      draftRule.value = makeDraft('validation')
    }
  }
})
</script>

<style scoped>
.wizard {
  padding: 8px 0;
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
.type-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.type-label {
  font-weight: 600;
  margin-bottom: 4px;
}
.type-desc {
  font-size: 12px;
  line-height: 1.4;
}
.wizard-footer {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>