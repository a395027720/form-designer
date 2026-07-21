<template>
  <div class="rule-editor">
    <a-form layout="vertical" size="small">
      <a-form-item label="规则名称">
        <a-input v-model:value="local.name" placeholder="如：平均红细胞体积" />
      </a-form-item>

      <a-form-item label="计算方式">
        <a-select v-model:value="local.params.template" @change="onTemplateChange">
          <a-select-option v-for="t in templates" :key="t.value" :value="t.value">
            {{ t.label }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- 多字段选择：求和 / 求平均 / 求最大 / 求最小 -->
      <a-form-item
        v-if="isMultiFieldTemplate"
        label="选择参与计算的字段"
      >
        <div v-if="components.length === 0" class="text-muted" style="font-size:12px">
          暂无可选字段
        </div>
        <a-checkbox-group v-else v-model:value="selectedFields" @change="generateExpression">
          <div v-for="c in components" :key="c.id" style="margin-bottom:4px">
            <a-checkbox :value="c.id">
              {{ c.label }} <span class="text-muted" style="font-size:11px">({{ c.field }})</span>
            </a-checkbox>
          </div>
        </a-checkbox-group>
        <div class="text-muted" style="font-size:12px;margin-top:4px">
          已选 {{ selectedFields.length }} 个字段
        </div>
      </a-form-item>

      <!-- 双字段选择：百分比 / 占比 / 差值 -->
      <template v-if="isTwoFieldTemplate">
        <a-form-item label="字段 A（分子 / 被减数）">
          <a-select
            v-model:value="fieldA"
            placeholder="选择第一个字段"
            @change="generateExpression"
            allow-clear
          >
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }} <span class="text-muted" style="font-size:11px">({{ c.field }})</span>
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="字段 B（分母 / 减数）">
          <a-select
            v-model:value="fieldB"
            placeholder="选择第二个字段"
            @change="generateExpression"
            allow-clear
          >
            <a-select-option v-for="c in components" :key="c.id" :value="c.id">
              {{ c.label }} <span class="text-muted" style="font-size:11px">({{ c.field }})</span>
            </a-select-option>
          </a-select>
        </a-form-item>
      </template>

      <!-- 生成的表达式预览（非自定义模式） -->
      <a-form-item v-if="!isCustom && local.params.expression" label="表达式预览">
        <code class="expr-preview">{{ readableExpression }}</code>
      </a-form-item>

      <!-- 自定义表达式 -->
      <a-form-item v-if="isCustom" label="表达式">
        <ExpressionEditor
          v-model="local.params.expression"
          :components="components"
        />
      </a-form-item>

      <a-form-item label="保留小数位">
        <a-input-number v-model:value="local.params.precision" :min="0" :max="6" style="width: 100%" />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { CalculationParams, ComponentDef, RuleDef } from '@/types/template'
import { uid } from '@/utils/uid'
import ExpressionEditor from './ExpressionEditor.vue'

const props = defineProps<{
  rule?: RuleDef
  components: ComponentDef[]
}>()
const emit = defineEmits<{ 'update:rule': [RuleDef] }>()

const templates = [
  { value: 'sum', label: '➕ 求和' },
  { value: 'average', label: '➗ 求平均' },
  { value: 'max', label: '⬆️ 求最大' },
  { value: 'min', label: '⬇️ 求最小' },
  { value: 'percent', label: '％ 百分比 (A / B × 100)' },
  { value: 'subtract', label: '➖ 差值 (A - B)' },
  { value: 'custom', label: '✏️ 自定义表达式' }
]

const local = reactive<RuleDef>(props.rule ? JSON.parse(JSON.stringify(props.rule)) : {
  id: uid('rule_'),
  type: 'calculation',
  name: '新计算规则',
  enabled: true,
  trigger: 'onChange',
  params: { template: 'sum', expression: '', precision: 2 } as CalculationParams
})

const selectedFields = ref<string[]>([])
const fieldA = ref<string>('')
const fieldB = ref<string>('')

const isMultiFieldTemplate = computed(() =>
  ['sum', 'average', 'max', 'min'].includes(local.params.template)
)
const isTwoFieldTemplate = computed(() =>
  ['percent', 'subtract'].includes(local.params.template)
)
const isCustom = computed(() => local.params.template === 'custom')

/** 将表达式中的 $.components.xxx.value 替换为可读的字段标签 */
const readableExpression = computed(() => {
  let expr = local.params.expression || ''
  if (!expr) return ''
  return expr.replace(/\$\.components\.([a-zA-Z0-9_]+)\.value/g, (_m, id) => {
    const comp = props.components.find(c => c.id === id)
    return comp ? comp.label : id
  })
})

/** 从已有表达式解析出引用的字段 ID */
function parseFieldIds(expr: string): string[] {
  if (!expr) return []
  const ids = new Set<string>()
  const re = /\$\.components\.([a-zA-Z0-9_]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(expr)) !== null) {
    ids.add(m[1])
  }
  return Array.from(ids).filter(id => props.components.some(c => c.id === id))
}

/** 根据选中的字段生成表达式 */
function generateExpression() {
  const tpl = local.params.template
  if (isMultiFieldTemplate.value) {
    const refs = selectedFields.value.map(id => `$.components.${id}.value`)
    if (tpl === 'sum')
      local.params.expression = refs.join(' + ') || ''
    else if (tpl === 'average')
      local.params.expression = refs.length ? `(${refs.join(' + ')}) / ${refs.length}` : ''
    else if (tpl === 'max')
      local.params.expression = refs.length ? `Math.max(${refs.join(', ')})` : ''
    else if (tpl === 'min')
      local.params.expression = refs.length ? `Math.min(${refs.join(', ')})` : ''
  } else if (isTwoFieldTemplate.value) {
    const a = fieldA.value ? `$.components.${fieldA.value}.value` : '0'
    const b = fieldB.value ? `$.components.${fieldB.value}.value` : '1'
    if (tpl === 'percent')
      local.params.expression = `(${a}) / (${b}) * 100`
    else if (tpl === 'subtract')
      local.params.expression = `${a} - ${b}`
  }
  // custom 模式不自动生成
}

/** 切换模板时，尝试从当前表达式恢复字段选择 */
function onTemplateChange(val: string) {
  const ids = parseFieldIds(local.params.expression)
  if (['sum', 'average', 'max', 'min'].includes(val)) {
    selectedFields.value = ids
    fieldA.value = ''
    fieldB.value = ''
  } else if (['percent', 'subtract'].includes(val)) {
    fieldA.value = ids[0] || ''
    fieldB.value = ids[1] || ''
    selectedFields.value = []
  } else {
    selectedFields.value = []
    fieldA.value = ''
    fieldB.value = ''
  }
  generateExpression()
}

// 编辑模式：从已有表达式初始化字段选择
function initFromExpression() {
  const ids = parseFieldIds(local.params.expression)
  if (isMultiFieldTemplate.value) {
    selectedFields.value = ids
  } else if (isTwoFieldTemplate.value) {
    fieldA.value = ids[0] || ''
    fieldB.value = ids[1] || ''
  }
}
initFromExpression()

watch(local, () => emit('update:rule', JSON.parse(JSON.stringify(local))), { deep: true })
</script>

<style scoped>
.rule-editor {
  padding: 8px 0;
}
.expr-preview {
  display: block;
  padding: 6px 10px;
  background: #f6f8fa;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
  color: #1f2937;
  font-family: 'SF Mono', Menlo, Monaco, monospace;
}
</style>
