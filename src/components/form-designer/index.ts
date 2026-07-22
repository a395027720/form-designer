// 主入口：导出所有公开 API

// 组件
export { default as FormDesigner } from './FormDesigner.vue'
export { default as FormRenderer } from './FormRenderer.vue'

export type {
  BasicComponentType,
  RuleType,
  TriggerType,
  RuleActionType,
  RuleAction,
  ThresholdRange,
  CalculationParams,
  ThresholdParams,
  ComparisonParams,
  ConditionalParams,
  ValidationValidator,
  ValidationParams,
  RuleDef,
  SelectOption,
  ComponentDef,
  FormTemplate,
  FormDesignerMode,
  FormDesignerProps,
  FormDesignerEmits,
  FormRendererProps,
  FormRendererEmits
} from './types'

export { isValidComponentDef, validateTemplate } from './validate'
export type { ValidationResult } from './validate'

export { uid } from './utils/uid'
export { parseComponentJson, injectProps, serializeComponentJson, extractProps, serializeRuleExpress } from './utils/componentIO'

export { BASIC_COMPONENTS, getBasicComponentByType } from './basicComponents'
export type { BasicComponentMeta } from './basicComponents'

export { RuleEngine } from './runtime/RuleEngine'
export { ExpressionEvaluator } from './runtime/ExpressionEvaluator'
export { ActionApplier, createDefaultState, patchState } from './runtime/ActionApplier'
export type { FieldState, SetFieldState } from './runtime/ActionApplier'
export type { ValueResolver as ExpressionValueResolver } from './runtime/ExpressionEvaluator'
