<template>
  <div class="rule-editor">
    <a-form layout="vertical" size="small">
      <a-form-item label="规则名称">
        <a-input v-model:value="local.name" placeholder="如：女性显示妊娠项" @blur="emitUpdate" />
      </a-form-item>

      <a-form-item>
        <template #label>
          <span>当 <a-select v-model:value="triggerCompId" style="width: 160px" placeholder="选择触发字段" @change="onTriggerChange">
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select> 的值为</span>
        </template>
        <a-space>
          <a-select v-model:value="local.params.when.operator" style="width: 90px">
            <a-select-option v-for="o in operators" :key="o.v" :value="o.v">{{ o.l }}</a-select-option>
          </a-select>
          <a-select v-model:value="valueType" style="width: 160px" @change="onValueTypeChange">
            <a-select-option value="constant">常量</a-select-option>
            <a-select-option value="options" :disabled="(triggerComp?.options || []).length === 0">
              该字段的某个选项
            </a-select-option>
          </a-select>
          <a-input
            v-if="valueType === 'constant'"
            v-model:value="constValue"
            placeholder="输入比较值"
            style="width: 160px"
            @change="onConstValueChange"
          />
          <a-select
            v-else-if="valueType === 'options' && triggerComp"
            v-model:value="optionValue"
            style="width: 160px"
            @change="onOptionValueChange"
          >
            <a-select-option v-for="o in (triggerComp.options || [])" :key="o.value" :value="o.value">
              {{ o.label }}
            </a-select-option>
          </a-select>
        </a-space>
      </a-form-item>

      <a-form-item label="则">
        <a-space>
          <a-select v-model:value="local.params.then.type" style="width: 90px">
            <a-select-option value="show">显示</a-select-option>
            <a-select-option value="hidden">隐藏</a-select-option>
          </a-select>
          <a-select v-model:value="targetCompId" style="width: 160px" placeholder="选择目标字段" @change="onTargetChange">
            <a-select-option v-for="c in otherComponents" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select>
        </a-space>
      </a-form-item>

      <a-form-item label="否则（可选）">
        <a-space>
          <a-select v-model:value="elseType" style="width: 90px" @change="onElseTypeChange">
            <a-select-option value="hidden">隐藏</a-select-option>
            <a-select-option value="show">显示</a-select-option>
            <a-select-option value="none">不操作</a-select-option>
          </a-select>
          <span v-if="elseType !== 'none'" class="text-muted">同一个目标字段</span>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { ComponentDef, RuleDef } from '@/types/template'
import { uid } from '@/utils/uid'

const props = defineProps<{ rule?: RuleDef; components: ComponentDef[]; selfId: string }>()
const emit = defineEmits<{ 'update:rule': [RuleDef] }>()

const operators = [
  { v: '==', l: '等于' },
  { v: '!=', l: '不等于' },
  { v: '>', l: '大于' },
  { v: '<', l: '小于' }
]

const safeDefault = {
  id: uid('rule_'),
  type: 'conditional' as const,
  name: '条件显隐',
  enabled: true,
  trigger: 'onChange' as const,
  params: {
    when: {
      operator: '==' as const,
      left: '',
      right: { type: 'constant' as const, value: '' }
    },
    then: { type: 'show' as const, target: '' },
    else: { type: 'hidden' as const, target: '' }
  }
}

const rawRule = props.rule ? JSON.parse(JSON.stringify(props.rule)) : safeDefault
// 防御：已有规则可能 params 不完整（如 params 为 {}），用默认值补全
if (!rawRule.params?.when) {
  rawRule.params = { ...safeDefault.params }
}
const local = reactive<RuleDef>(rawRule)

const triggerCompId = ref<string>(extractId(local.params.when.left))
const targetCompId = ref<string>(extractId(local.params.then.target))
const valueType = ref<'constant' | 'options'>(typeof local.params.when.right === 'object' ? 'constant' : 'constant')
const constValue = ref<string>(typeof local.params.when.right === 'object' ? String(local.params.when.right.value) : '')
const optionValue = ref<string>('')
const elseType = ref<'show' | 'hidden' | 'none'>('hidden')

const triggerComp = computed(() => props.components.find(c => c.id === triggerCompId.value))
const otherComponents = computed(() => props.components.filter(c => c.id !== props.selfId))

function extractId(path: string) {
  const m = path?.match?.(/\$\.components\.([^.]+)/)
  return m ? m[1] : ''
}

const emitUpdate = () => {
  emit('update:rule', JSON.parse(JSON.stringify(local)))
}

const onTriggerChange = () => {
  local.params.when.left = `$.components.${triggerCompId.value}.value`
  // 切换触发字段后若新字段无选项，回退到常量模式
  if (valueType.value === 'options' && (triggerComp.value?.options || []).length === 0) {
    valueType.value = 'constant'
    local.params.when.right = { type: 'constant', value: '' }
  }
  emitUpdate()
}
const onTargetChange = () => {
  local.params.then.target = `$.components.${targetCompId.value}`
  local.params.else!.target = `$.components.${targetCompId.value}`
  emitUpdate()
}
const onValueTypeChange = () => {
  if (valueType.value === 'constant') {
    local.params.when.right = { type: 'constant', value: constValue.value }
  } else if (optionValue.value) {
    local.params.when.right = { type: 'constant', value: optionValue.value }
  }
  emitUpdate()
}
const onConstValueChange = () => {
  local.params.when.right = { type: 'constant', value: constValue.value }
  emitUpdate()
}
const onOptionValueChange = () => {
  local.params.when.right = { type: 'constant', value: optionValue.value }
  emitUpdate()
}
const onElseTypeChange = () => {
  if (elseType.value === 'none') {
    local.params.else = undefined
  } else {
    local.params.else = { type: elseType.value, target: `$.components.${targetCompId.value}` }
  }
  emitUpdate()
}

// 兜底：直接 v-model 到 local.* 的 select 改动，emitUpdate 不写 local，不会死循环
watch(() => local, () => emitUpdate(), { deep: true })
</script>