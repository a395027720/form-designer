<template>
  <div class="rule-editor">
    <a-form layout="vertical" size="small">
      <a-form-item label="规则名称">
        <a-input v-model:value="local.name" placeholder="如：女性显示妊娠项" @blur="emitUpdate" />
      </a-form-item>

      <!-- 触发条件 -->
      <div class="condition-block">
        <div class="condition-label">触发条件</div>
        <div class="condition-row">
          <span class="condition-text">当</span>
          <a-select v-model:value="triggerCompId" style="flex:1;min-width:120px" placeholder="选择字段" :allow-clear="true" @change="onTriggerChange">
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select>
          <a-select v-model:value="cParams.when.operator" style="width:80px" @change="emitUpdate">
            <a-select-option v-for="o in operators" :key="o.v" :value="o.v">{{ o.l }}</a-select-option>
          </a-select>

          <!-- 比较值类型 -->
          <a-select v-model:value="rightType" style="width:90px" @change="onRightTypeChange">
            <a-select-option value="constant">常量</a-select-option>
            <a-select-option value="component">其他字段</a-select-option>
            <a-select-option v-if="triggerHasOptions" value="option">选项值</a-select-option>
          </a-select>
          <!-- 常量输入 -->
          <a-input
            v-if="rightType === 'constant'"
            v-model:value="constValue"
            placeholder="输入值"
            style="flex:1;min-width:100px"
            @change="onConstValueChange"
          />
          <!-- 其他字段 -->
          <a-select
            v-if="rightType === 'component'"
            v-model:value="rightCompId"
            style="flex:1;min-width:120px"
            placeholder="选择比较字段"
            :allow-clear="true"
            @change="onRightCompChange"
          >
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select>
          <!-- 选项值 -->
          <a-select
            v-if="rightType === 'option'"
            v-model:value="optionValue"
            style="flex:1;min-width:120px"
            placeholder="选择值"
            :allow-clear="true"
            @change="onOptionValueChange"
          >
            <a-select-option v-for="o in (triggerComp?.options || [])" :key="o.value" :value="String(o.value)">
              {{ o.label }}
            </a-select-option>
          </a-select>
          <span class="condition-text">时</span>
        </div>
      </div>

      <!-- 满足条件时 -->
      <div class="condition-block">
        <div class="condition-label">
          满足条件时
          <a-button size="small" type="link" @click="addThen">+ 添加</a-button>
        </div>
        <div v-for="(act, i) in cParams.then" :key="i" class="condition-row action-row">
          <a-select v-model:value="act.type" style="width:80px" @change="emitUpdate">
            <a-select-option value="show">显示</a-select-option>
            <a-select-option value="hidden">隐藏</a-select-option>
          </a-select>
          <a-select
            v-model:value="thenCompIds[i]"
            style="flex:1;min-width:120px"
            placeholder="选择目标字段"
            :allow-clear="true"
            @change="(v: string) => onThenTargetChange(i, v)"
          >
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select>
          <a-button size="small" danger @click="removeThen(i)">×</a-button>
        </div>
        <div v-if="!cParams.then.length" class="text-muted" style="font-size:12px;padding:4px 0">
          点击「+ 添加」配置条件满足时的操作
        </div>
      </div>

      <!-- 否则 -->
      <div class="condition-block">
        <div class="condition-label">
          否则
          <a-button size="small" type="link" @click="addElse">+ 添加</a-button>
        </div>
        <div v-for="(act, i) in cParams.else" :key="i" class="condition-row action-row">
          <a-select v-model:value="act.type" style="width:80px" @change="emitUpdate">
            <a-select-option value="show">显示</a-select-option>
            <a-select-option value="hidden">隐藏</a-select-option>
          </a-select>
          <a-select
            v-model:value="elseCompIds[i]"
            style="flex:1;min-width:120px"
            placeholder="选择目标字段"
            :allow-clear="true"
            @change="(v: string) => onElseTargetChange(i, v)"
          >
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select>
          <a-button size="small" danger @click="removeElse(i)">×</a-button>
        </div>
        <div v-if="!cParams.else.length" class="text-muted" style="font-size:12px;padding:4px 0">
          留空则条件不满足时不执行任何操作
        </div>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { ComponentDef, RuleDef, ConditionalParams, ConditionalAction } from '../../types'
import { uid } from '../../utils/uid'

const props = defineProps<{ rule?: RuleDef; components: ComponentDef[]; selfId: string }>()
const emit = defineEmits<{ 'update:rule': [RuleDef] }>()

const operators = [
  { v: '==' as const, l: '等于' },
  { v: '!=' as const, l: '不等于' },
  { v: '>' as const, l: '大于' },
  { v: '>=' as const, l: '大于等于' },
  { v: '<' as const, l: '小于' },
  { v: '<=' as const, l: '小于等于' }
]

const safeDefault: RuleDef = {
  id: uid('rule_'),
  type: 'conditional',
  name: '条件显隐',
  enabled: true,
  trigger: 'onChange',
  params: {
    when: { operator: '==', left: '', right: { type: 'constant', value: '' } },
    then: [],
    else: []
  }
}

function normalizeActions(actions: any): ConditionalAction[] {
  if (!actions) return []
  if (Array.isArray(actions)) return actions.map((a: any) => ({ type: a.type || 'show', target: a.target || '' }))
  // 兼容旧版单个 action 对象
  return [{ type: actions.type || 'show', target: actions.target || '' }]
}

const rawRule: RuleDef = props.rule ? JSON.parse(JSON.stringify(props.rule)) : safeDefault
const rawParams = rawRule.params as any
if (!rawParams?.when) {
  rawRule.params = JSON.parse(JSON.stringify(safeDefault.params))
} else {
  // 兼容旧版：then/else 可能是单个对象，转为数组
  rawParams.then = normalizeActions(rawParams.then)
  rawParams.else = normalizeActions(rawParams.else)
}
const local = reactive<RuleDef>(rawRule)
const cParams = local.params as ConditionalParams

const triggerCompId = ref<string>(extractId(cParams.when.left))

// 比较值类型 & 值
const rightRaw = cParams.when.right
const isRightObj = typeof rightRaw === 'object' && rightRaw !== null
const isRightRef = typeof rightRaw === 'string' && rightRaw !== ''
const rightType = ref<'constant' | 'component' | 'option'>(
  isRightRef ? 'component' : 'constant'
)
const constValue = ref<string>(isRightObj ? String((rightRaw as any).value ?? '') : '')
const rightCompId = ref<string>(isRightRef ? extractId(rightRaw as string) : '')
const optionValue = ref<string>(isRightObj ? String((rightRaw as any).value ?? '') : '')

// then/else 的 compId 数组，与 cParams.then/else 索引对应
const thenCompIds = ref<string[]>(cParams.then.map(a => extractId(a.target)))
const elseCompIds = ref<string[]>(cParams.else.map(a => extractId(a.target)))

const triggerComp = computed(() => props.components.find(c => c.id === triggerCompId.value))
const triggerHasOptions = computed(() => {
  const c = triggerComp.value
  if (!c) return false
  return ['Select', 'RadioGroup', 'CheckboxGroup'].includes(c.type) && (c.options?.length ?? 0) > 0
})

function extractId(path: string) {
  const m = path?.match?.(/\$\.components\.([^.]+)/)
  return m ? m[1] : ''
}

const emitUpdate = () => {
  // 过滤掉 target 为空的操作
  emit('update:rule', JSON.parse(JSON.stringify(local)))
}

const onTriggerChange = () => {
  cParams.when.left = `$.components.${triggerCompId.value}.value`
  constValue.value = ''
  optionValue.value = ''
  cParams.when.right = { type: 'constant', value: '' }
  emitUpdate()
}
const onRightTypeChange = () => {
  if (rightType.value === 'constant') {
    cParams.when.right = { type: 'constant', value: constValue.value }
  } else if (rightType.value === 'option') {
    cParams.when.right = { type: 'constant', value: optionValue.value }
  } else {
    cParams.when.right = rightCompId.value ? `$.components.${rightCompId.value}.value` : ''
  }
  emitUpdate()
}
const onRightCompChange = () => {
  cParams.when.right = rightCompId.value ? `$.components.${rightCompId.value}.value` : ''
  emitUpdate()
}
const onConstValueChange = () => {
  cParams.when.right = { type: 'constant', value: constValue.value }
  emitUpdate()
}
const onOptionValueChange = () => {
  cParams.when.right = { type: 'constant', value: optionValue.value }
  emitUpdate()
}

// === then actions ===
function addThen() {
  cParams.then.push({ type: 'show', target: '' })
  thenCompIds.value.push('')
  emitUpdate()
}
function removeThen(i: number) {
  cParams.then.splice(i, 1)
  thenCompIds.value.splice(i, 1)
  emitUpdate()
}
function onThenTargetChange(i: number, compId: string) {
  cParams.then[i].target = compId ? `$.components.${compId}` : ''
  emitUpdate()
}

// === else actions ===
function addElse() {
  cParams.else.push({ type: 'hidden', target: '' })
  elseCompIds.value.push('')
  emitUpdate()
}
function removeElse(i: number) {
  cParams.else.splice(i, 1)
  elseCompIds.value.splice(i, 1)
  emitUpdate()
}
function onElseTargetChange(i: number, compId: string) {
  cParams.else[i].target = compId ? `$.components.${compId}` : ''
  emitUpdate()
}
</script>

<style scoped>
.rule-editor {
  padding: 4px 0;
}
.condition-block {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.condition-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}
.condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.action-row {
  margin-bottom: 6px;
}
.condition-text {
  font-size: 13px;
  color: #1f2937;
  white-space: nowrap;
}
.text-muted {
  color: #94a3b8;
}
</style>
