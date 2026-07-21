/**
 * 模板/组件/规则的 TypeScript 类型定义
 * 对应 PRD 第 5 章 数据模型与 JSON Schema
 */

export type ComponentType =
  | 'Input'
  | 'Textarea'
  | 'InputNumber'
  | 'Select'
  | 'RadioGroup'
  | 'CheckboxGroup'
  | 'DatePicker'
  | 'TimePicker'
  | 'Switch'
  | 'DisplayText'

export type RuleType =
  | 'calculation'
  | 'threshold'
  | 'comparison'
  | 'conditional'
  | 'validation'

export type TriggerType = 'onChange' | 'onBlur' | 'onInit'

export interface SelectOption {
  label: string
  value: string | number
}

export interface FormLayout {
  type: 'form'
}

/** 阈值区间 */
export interface ThresholdRange {
  min: number | null
  max: number | null
  label: string
  level: 'low' | 'normal' | 'high' | string
  color: string
}

/** 副作用 */
export interface RuleAction {
  type:
    | 'setValue'
    | 'setStyle'
    | 'addClass'
    | 'removeClass'
    | 'setText'
    | 'show'
    | 'hidden'
    | 'setRequired'
  target: string
  style?: Record<string, string>
  value?: any
}

/** 规则参数（联合类型，按 type 分发） */
export interface CalculationParams {
  template: 'sum' | 'average' | 'max' | 'min' | 'percent' | 'ratio' | 'subtract' | 'custom'
  expression: string
  precision?: number
}

export interface ThresholdParams {
  ranges: ThresholdRange[]
  actions: RuleAction[]
}

export interface ComparisonParams {
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=' | 'between'
  left: string | { type: 'constant'; value: any }
  right: string | { type: 'constant'; value: any }
  actions: RuleAction[]
}

export interface ConditionalParams {
  when: {
    operator: '>' | '>=' | '<' | '<=' | '==' | '!='
    left: string
    right: string | { type: 'constant'; value: any }
  }
  then: { type: 'show' | 'hidden'; target: string }
  else: { type: 'show' | 'hidden'; target: string }
}

export interface ValidationValidator {
  type: 'required' | 'min' | 'max' | 'regex' | 'minLength' | 'maxLength'
  value?: number | string
  pattern?: string
  message: string
}

export interface ValidationParams {
  validators: ValidationValidator[]
}

/** 单条规则定义 */
export interface RuleDef {
  id: string
  type: RuleType
  name: string
  enabled: boolean
  trigger: TriggerType
  params: CalculationParams | ThresholdParams | ComparisonParams | ConditionalParams | ValidationParams
}

/** 组件定义 */
export interface ComponentDef {
  id: string
  type: ComponentType
  field: string
  label: string
  unit?: string
  defaultValue?: any
  required: boolean
  /**
   * 输入框自身 CSS 宽度（px）。不设置则跟随组件栅格宽度（width: 100%）。
   */
  inputWidth?: number
  /**
   * 组件内文字颜色（CSS color）。不设置则继承 antd 默认。
   */
  fontColor?: string
  /**
   * 组件内文字大小（px）。不设置则继承 antd 默认。
   */
  fontSize?: number
  props?: Record<string, any>
  options?: SelectOption[]
  rules: RuleDef[]
  children?: ComponentDef[]
}

/** 模板整体定义 */
export interface FormTemplate {
  version: string
  id: string
  name: string
  category: string
  description?: string
  layout: FormLayout
  components: ComponentDef[]
  createdAt?: string
  updatedAt?: string
}

/** 模板元信息（列表展示用） */
export interface TemplateMeta {
  id: string
  name: string
  category: string
  description?: string
  componentCount: number
  createdAt: string
  updatedAt: string
}