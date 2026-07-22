/**
 * 把规则对象翻译成自然语言描述，方便用户理解规则在做什么
 */
import type { RuleDef, ComponentDef, ThresholdParams, ComparisonParams, ConditionalParams, ValidationParams, CalculationParams } from '@/components/form-designer'

const TYPE_LABELS: Record<RuleDef['type'], string> = {
  calculation: '计算',
  threshold: '阈值分级',
  comparison: '比较',
  conditional: '条件显隐',
  validation: '校验'
}

export function ruleTypeLabel(t: RuleDef['type']) {
  return TYPE_LABELS[t] || t
}

const refLabel = (path: string, comps: ComponentDef[]): string => {
  // path 形如 $.components.xxx.value
  const m = path.match(/\$\.components\.([^.]+)\.value/)
  if (!m) return path
  const c = comps.find(c => c.id === m[1])
  return c ? `「${c.label}」` : `[未知字段 ${m[1]}]`
}

const constLabel = (v: any): string => {
  if (v === null || v === undefined) return '空'
  return String(v)
}

const opLabel = (op: string): string => {
  return ({
    '>': '大于',
    '>=': '大于等于',
    '<': '小于',
    '<=': '小于等于',
    '==': '等于',
    '!=': '不等于',
    'between': '在区间内'
  } as Record<string, string>)[op] || op
}

export function describeRule(rule: RuleDef, comps: ComponentDef[]): string {
  if (!rule.enabled) return '（已禁用）'
  switch (rule.type) {
    case 'calculation':
      return describeCalculation(rule.params as CalculationParams, comps)
    case 'threshold':
      return describeThreshold(rule.params as ThresholdParams, rule.id)
    case 'comparison':
      return describeComparison(rule.params as ComparisonParams, comps)
    case 'conditional':
      return describeConditional(rule.params as ConditionalParams, comps)
    case 'validation':
      return describeValidation(rule.params as ValidationParams)
    default:
      return ''
  }
}

function describeCalculation(p: CalculationParams, comps: ComponentDef[]): string {
  if (p.template && p.template !== 'custom') {
    return `使用「${p.template}」预设模板计算`
  }
  // 替换表达式中的引用为标签
  const friendly = p.expression.replace(/\$\.components\.([^.]+)\.value/g, (_, id) => {
    const c = comps.find(c => c.id === id)
    return c ? `「${c.label}」` : `[${id}]`
  })
  return `计算公式：${friendly}${p.precision !== undefined ? `（保留 ${p.precision} 位小数）` : ''}`
}

function describeThreshold(p: ThresholdParams, _ruleId: string): string {
  if (!p.ranges?.length) return '（无区间）'
  const parts = p.ranges.map(r => {
    const lo = r.min === null ? '-∞' : r.min
    const hi = r.max === null ? '+∞' : r.max
    return `${lo}~${hi} → "${r.label}"`
  })
  return `分级区间：${parts.join('；')}`
}

function constantValue(v: any): any {
  if (v && typeof v === 'object' && v.type === 'constant') return v.value
  return v
}

function describeComparison(p: ComparisonParams, comps: ComponentDef[]): string {
  const left = typeof p.left === 'string' ? refLabel(p.left, comps) : constLabel(constantValue(p.left))
  const right = typeof p.right === 'string' ? refLabel(p.right, comps) : constLabel(constantValue(p.right))
  return `当 ${left} ${opLabel(p.operator)} ${right} 时触发副作用`
}

function describeConditional(p: ConditionalParams, comps: ComponentDef[]): string {
  if (!p.when) return '（条件参数不完整）'
  const left = refLabel(p.when.left, comps)
  const right = typeof p.when.right === 'string' ? refLabel(p.when.right, comps) : constLabel(constantValue(p.when.right))
  const thenParts = (p.then || []).map(a => compAction(a.type, a.target, comps)).join('、')
  const elseParts = (p.else || []).filter(a => a.target).map(a => compAction(a.type, a.target, comps)).join('、')
  let s = `当 ${left} ${opLabel(p.when.operator)} ${right} 时，${thenParts || '（未设置）'}`
  if (elseParts) s += `；否则 ${elseParts}`
  return s
}

function compAction(type: string, target: string, comps: ComponentDef[]): string {
  if (!target) return type === 'show' ? '显示（未设置）' : '隐藏（未设置）'
  const m = target.match(/\$\.components\.([^.]+)(\.suffix)?/)
  let name = target
  if (m && m[1]) {
    const c = comps.find(c => c.id === m[1])
    name = c ? `「${c.label}」${m[2] ? '（后缀）' : ''}` : target
  }
  return type === 'show' ? `显示 ${name}` : `隐藏 ${name}`
}

function describeValidation(p: ValidationParams): string {
  if (!p.validators?.length) return '（无校验项）'
  const parts = p.validators.map(v => {
    if (v.type === 'required') return '必填'
    if (v.type === 'min') return `≥ ${v.value}`
    if (v.type === 'max') return `≤ ${v.value}`
    if (v.type === 'minLength') return `长度 ≥ ${v.value}`
    if (v.type === 'maxLength') return `长度 ≤ ${v.value}`
    if (v.type === 'regex') return `匹配正则 ${v.pattern}`
    return v.type
  })
  return `校验：${parts.join('，')}`
}