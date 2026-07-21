/**
 * 规则引擎
 * 监听组件值变化、按 trigger 分发、执行规则、收集副作用、应用到组件实例
 */
import type { ComponentDef, RuleDef, ThresholdParams, ComparisonParams, ConditionalParams, CalculationParams } from '@/types/template'
import { ExpressionEvaluator } from './ExpressionEvaluator'
import { ActionApplier, type SetFieldState } from './ActionApplier'

export class RuleEngine {
  private evaluator: ExpressionEvaluator
  private applier: ActionApplier
  private values: Map<string, any>
  private components: ComponentDef[]
  private visibility: Map<string, boolean>

  /** 外部传入：值变化时由 FormRenderer 监听 */
  public onCalculationValue: ((id: string, value: any) => void) | null = null

  constructor(opts: {
    components: ComponentDef[]
    values: Map<string, any>,
    setFieldState: SetFieldState,
    visibility?: Map<string, boolean>
  }) {
    this.components = opts.components
    this.values = opts.values
    this.applier = new ActionApplier(opts.setFieldState)
    this.visibility = opts.visibility || new Map(opts.components.map(c => [c.id, true]))
    this.evaluator = new ExpressionEvaluator((id) => this.values.get(id))
  }

  /** 值变化入口 */
  onValueChange(componentId: string, newValue: any) {
    this.values.set(componentId, newValue)
    const component = this.components.find(c => c.id === componentId)
    if (!component) return

    // 找所有依赖于当前组件值的规则（包括当前组件自身的 + 其他组件的 conditional/comparison）
    for (const c of this.components) {
      // 先归零可变副作用，再跑规则，避免旧副作用残留（如比较不匹配时仍显示红框）
      this.applier.resetTransient(c.id)
      for (const rule of c.rules) {
        if (!rule.enabled) continue
        if (rule.trigger === 'onInit' || rule.trigger === 'onChange') {
          this.runRule(c, rule)
        }
      }
    }
  }

  /** 初始触发 onInit 规则 */
  runInit() {
    for (const c of this.components) {
      this.applier.resetTransient(c.id)
      for (const rule of c.rules) {
        if (!rule.enabled) continue
        if (rule.trigger === 'onInit') this.runRule(c, rule)
        if (rule.trigger === 'onChange') this.runRule(c, rule)
      }
    }
  }

  private runRule(ownerComp: ComponentDef, rule: RuleDef) {
    try {
      switch (rule.type) {
        case 'calculation': this.runCalculation(ownerComp, rule); break
        case 'threshold': this.runThreshold(ownerComp, rule); break
        case 'comparison': this.runComparison(ownerComp, rule); break
        case 'conditional': this.runConditional(rule); break
        case 'validation': /* 在 FormRenderer 中由 a-form rules 接管 */ break
      }
    } catch (e: any) {
      console.warn('[RuleEngine] 规则执行失败', rule.id, e.message)
    }
  }

  private runCalculation(owner: ComponentDef, rule: RuleDef) {
    const p = rule.params as CalculationParams
    const result = this.evaluator.evaluate(p.expression)
    if (result === undefined || result === null) return
    let final = result
    if (p.precision !== undefined && typeof result === 'number') {
      final = Number(result.toFixed(p.precision))
    }
    if (this.values.get(owner.id) !== final) {
      this.values.set(owner.id, final)
      this.onCalculationValue?.(owner.id, final)
    }
  }

  private runThreshold(owner: ComponentDef, rule: RuleDef) {
    const p = rule.params as ThresholdParams
    const v = Number(this.values.get(owner.id))
    if (isNaN(v)) return
    const ranges = p.ranges
    if (ranges.length === 0) return
    let matched = ranges.find(r => {
      const minOk = r.min == null || v >= Number(r.min)
      const maxOk = r.max == null || v <= Number(r.max)
      return minOk && maxOk
    })
    // 值超出所有区间边界时，自动落到首/尾区间作为兜底：
    // 低于最低区间 → 首区间，高于最高区间 → 尾区间
    if (!matched) {
      const first = ranges[0]
      const last = ranges[ranges.length - 1]
      if (first.min != null && v < Number(first.min)) matched = first
      else if (last.max != null && v > Number(last.max)) matched = last
    }
    if (!matched) return
    const context: Record<string, any> = {
      level: matched.level,
      label: matched.label,
      color: matched.color
    }
    for (const action of p.actions) {
      this.applier.apply(action, owner.id, context)
    }
  }

  private runComparison(owner: ComponentDef, rule: RuleDef) {
    const p = rule.params as ComparisonParams
    const leftVal = this.readSide(p.left)
    const rightVal = this.readSide(p.right)
    if (leftVal === undefined || rightVal === undefined) return
    const matched = this.matchOp(p.operator, leftVal, rightVal)
    if (!matched) return
    for (const action of p.actions) {
      this.applier.apply(action, owner.id)
    }
  }

  private runConditional(rule: RuleDef) {
    const p = rule.params as ConditionalParams
    const leftVal = this.readSide(p.when.left)
    const rightVal = this.readSide(p.when.right)
    // 值未填时当作"不匹配"处理，走 else 分支（隐藏目标字段），
    // 避免触发字段为空时目标字段保持初始 visible=true 的状态
    const matched = leftVal !== undefined && rightVal !== undefined
      ? this.matchOp(p.when.operator, leftVal, rightVal)
      : false
    const action = matched ? p.then : p.else
    if (!action) return
    this.applier.apply(
      { type: action.type === 'show' ? 'show' : 'hidden', target: action.target },
      // selfId not used here
      ''
    )
    // 同步 visibility map
    const m = action.target.match(/\$\.components\.([^.]+)/)
    if (m) {
      this.visibility.set(m[1], action.type === 'show')
    }
  }

  private readSide(side: string | { type: 'constant'; value: any }): any {
    if (typeof side === 'object' && side.type === 'constant') return side.value
    if (typeof side === 'string') {
      const m = side.match(/^\$\.components\.([^.]+)\.value$/)
      if (m) return this.values.get(m[1])
    }
    return undefined
  }

  private matchOp(op: string, l: any, r: any): boolean {
    switch (op) {
      case '>': return Number(l) > Number(r)
      case '>=': return Number(l) >= Number(r)
      case '<': return Number(l) < Number(r)
      case '<=': return Number(l) <= Number(r)
      case '==': return l == r
      case '!=': return l != r
      default: return false
    }
  }

  isVisible(id: string): boolean {
    return this.visibility.get(id) !== false
  }
}