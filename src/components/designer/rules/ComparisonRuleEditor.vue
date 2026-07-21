<template>
  <div class="rule-editor">
    <a-form layout="vertical" size="small">
      <a-form-item label="规则名称">
        <a-input v-model:value="local.name" placeholder="如：血糖过高" @blur="emitUpdate" />
      </a-form-item>

      <a-form-item label="触发条件">
        <a-space>
          <span>当</span>
          <a-select v-model:value="leftType" style="width: 100px" @change="onLeftTypeChange">
            <a-select-option value="self">当前字段</a-select-option>
            <a-select-option value="component">其他字段</a-select-option>
          </a-select>
          <a-select
            v-if="leftType === 'component'"
            v-model:value="leftCompId"
            style="width: 160px"
            placeholder="选择字段"
            @change="onLeftCompChange"
          >
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select>
          <a-select v-model:value="local.params.operator" style="width: 90px">
            <a-select-option v-for="o in operators" :key="o.v" :value="o.v">{{ o.l }}</a-select-option>
          </a-select>
          <span>大于/小于</span>
          <a-select v-model:value="rightType" style="width: 100px" @change="onRightTypeChange">
            <a-select-option value="constant">常量</a-select-option>
            <a-select-option value="component">其他字段</a-select-option>
          </a-select>
          <a-input-number
            v-if="rightType === 'constant'"
            v-model:value="rightConst"
            style="width: 120px"
            @change="onRightConstChange"
          />
          <a-select
            v-if="rightType === 'component'"
            v-model:value="rightCompId"
            style="width: 160px"
            placeholder="选择字段"
            @change="onRightCompChange"
          >
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }}
            </a-select-option>
          </a-select>
        </a-space>
      </a-form-item>

      <a-form-item label="副作用">
        <a-checkbox v-model:checked="enableStyle">字体变红</a-checkbox>
        <a-checkbox v-model:checked="enableClass">加红框</a-checkbox>
        <a-checkbox v-model:checked="enableText">附加「异常」文字</a-checkbox>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { ComponentDef, RuleDef } from '@/types/template'
import { uid } from '@/utils/uid'

const props = defineProps<{ rule?: RuleDef; components: ComponentDef[] }>()
const emit = defineEmits<{ 'update:rule': [RuleDef] }>()

const operators = [
  { v: '>', l: '大于 >' },
  { v: '>=', l: '大于等于 ≥' },
  { v: '<', l: '小于 <' },
  { v: '<=', l: '小于等于 ≤' },
  { v: '==', l: '等于 =' },
  { v: '!=', l: '不等于 ≠' }
]

const local = reactive<RuleDef>(props.rule ? JSON.parse(JSON.stringify(props.rule)) : {
  id: uid('rule_'),
  type: 'comparison',
  name: '比较规则',
  enabled: true,
  trigger: 'onChange',
  params: {
    operator: '>',
    left: '$.self.value',
    right: { type: 'constant', value: 0 },
    actions: []
  }
})

const leftType = ref<'self' | 'component'>(typeof local.params.left === 'string' && local.params.left === '$.self.value' ? 'self' : 'component')
const leftCompId = ref<string>(typeof local.params.left === 'string' ? extractId(local.params.left) : '')
const rightType = ref<'constant' | 'component'>(typeof local.params.right === 'object' ? 'constant' : 'component')
const rightCompId = ref<string>(typeof local.params.right === 'string' ? extractId(local.params.right) : '')
const rightConst = ref<number>(typeof local.params.right === 'object' ? Number(local.params.right.value) : 0)

const hasAction = (type: string) =>
  (props.rule?.params as any)?.actions?.some((a: any) => a.type === type) ?? false

const enableStyle = ref(props.rule?.params ? hasAction('setStyle') : false)
const enableClass = ref(props.rule?.params ? hasAction('addClass') : true)
const enableText = ref(props.rule?.params ? hasAction('setText') : false)

function extractId(path: string) {
  const m = path.match(/\$\.components\.([^.]+)\.value/)
  return m ? m[1] : ''
}

const emitUpdate = () => {
  const actions: any[] = []
  if (enableStyle.value) actions.push({ type: 'setStyle', target: '$.self', style: { color: '#f5222d' } })
  if (enableClass.value) actions.push({ type: 'addClass', target: '$.self', value: 'is-abnormal' })
  if (enableText.value) actions.push({ type: 'setText', target: '$.self.suffix', value: '（异常）' })
  local.params.actions = actions
  emit('update:rule', JSON.parse(JSON.stringify(local)))
}

const onLeftTypeChange = () => {
  local.params.left = leftType.value === 'self' ? '$.self.value' : `$.components.${leftCompId.value}.value`
  emitUpdate()
}
const onLeftCompChange = () => {
  local.params.left = `$.components.${leftCompId.value}.value`
  emitUpdate()
}
const onRightTypeChange = () => {
  local.params.right = rightType.value === 'constant' ? { type: 'constant', value: rightConst.value } : `$.components.${rightCompId.value}.value`
  emitUpdate()
}
const onRightConstChange = () => {
  local.params.right = { type: 'constant', value: rightConst.value }
  emitUpdate()
}
const onRightCompChange = () => {
  local.params.right = `$.components.${rightCompId.value}.value`
  emitUpdate()
}

// 副作用 checkbox 变化时同步
watch([enableStyle, enableClass, enableText], () => emitUpdate())
// 操作符/名称等输入变化时同步到 wizard
watch(() => local, () => emit('update:rule', JSON.parse(JSON.stringify(local))), { deep: true })
</script>