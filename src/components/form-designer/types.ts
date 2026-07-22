/** antd 基础组件类型 */
export type BasicComponentType =
  | "Input"
  | "Textarea"
  | "InputNumber"
  | "Select"
  | "RadioGroup"
  | "CheckboxGroup"
  | "DatePicker"
  | "TimePicker"
  | "Switch"
  | "DisplayText"
  | "Upload";

/** 规则类型 */
export type RuleType =
  | "calculation"
  | "threshold"
  | "comparison"
  | "conditional"
  | "validation";

export type TriggerType = "onChange" | "onBlur" | "onInit";

/** 阈值区间 */
export interface ThresholdRange {
  min: number | null;
  max: number | null;
  label: string;
  level: "low" | "normal" | "high" | string;
  color: string;
}

/** 规则副作用 */
export type RuleActionType =
  | "setValue"
  | "setStyle"
  | "addClass"
  | "removeClass"
  | "show"
  | "hidden"
  | "setText"
  | "setRequired";

export interface RuleAction {
  type: RuleActionType;
  target: string;
  style?: Record<string, string>;
  value?: any;
}

/** 规则参数 */
export interface CalculationParams {
  template:
    | "sum"
    | "average"
    | "max"
    | "min"
    | "percent"
    | "ratio"
    | "subtract"
    | "custom";
  expression: string;
  precision?: number;
}

export interface ThresholdParams {
  ranges: ThresholdRange[];
  actions: RuleAction[];
}

export interface ComparisonParams {
  operator: ">" | ">=" | "<" | "<=" | "==" | "!=" | "between";
  left: string | { type: "constant"; value: any };
  right: string | { type: "constant"; value: any };
  actions: RuleAction[];
}

export interface ConditionalAction {
  type: "show" | "hidden";
  target: string;
}

export interface ConditionalParams {
  when: {
    operator: ">" | ">=" | "<" | "<=" | "==" | "!=";
    left: string;
    right: string | { type: "constant"; value: any };
  };
  /** 条件满足时执行的操作（支持多个） */
  then: ConditionalAction[];
  /** 条件不满足时执行的操作（支持多个） */
  else: ConditionalAction[];
}

export interface ValidationValidator {
  type: "required" | "min" | "max" | "regex" | "minLength" | "maxLength";
  value?: number | string;
  pattern?: string;
  message: string;
}

export interface ValidationParams {
  validators: ValidationValidator[];
}

/** 规则定义 */
export interface RuleDef {
  id: string;
  type: RuleType;
  name: string;
  enabled: boolean;
  trigger: TriggerType;
  params:
    | CalculationParams
    | ThresholdParams
    | ComparisonParams
    | ConditionalParams
    | ValidationParams;
}

/** 组件定义（"小项目" = 一个具体字段） */
export interface ComponentDef {
  id: string;
  type: BasicComponentType;
  field: string;
  label: string;
  required?: boolean;
  unit?: string;
  defaultValue?: any;
  inputWidth?: number;
  fontColor?: string;
  fontSize?: number;
  props?: Record<string, any>;
  options?: SelectOption[];
  /** 接口获取选项：配置后优先于手动 options */
  api?: string;
  rules?: RuleDef[];
  children?: ComponentDef[];
}

/** 选项 */
export interface SelectOption {
  label: string;
  value: string | number;
}

/** 模板定义（大项，components[] 纯 inline） */
export interface FormTemplate {
  id: string;
  version?: string;
  /** 模板名称（列表展示用，可选） */
  name?: string;
  /** 分类（列表筛选用，可选） */
  category?: string;
  /** 描述，可选 */
  description?: string;
  components: ComponentDef[];
  /** 创建时间 ISO string，可选 */
  createdAt?: string;
  /** 更新时间 ISO string，可选 */
  updatedAt?: string;
  metadata?: Record<string, any>;
}

/** FormDesigner mode */
export type FormDesignerMode = "field" | "basic" | "presets";

/** FormDesigner props */
export interface FormDesignerProps {
  mode: FormDesignerMode;
  item?: ComponentDef | FormTemplate;
  /** field 模式：可被规则引用的字段库；presets 模式：左侧可拖入的字段库。统一叫「items」 */
  items?: ComponentDef[];
  readonly?: boolean;
  /** presets 模式搜索函数 */
  searchFn?: (item: ComponentDef, keyword: string) => boolean;
}

/** FormDesigner emits */
export interface FormDesignerEmits {
  (e: "update:item", value: ComponentDef | FormTemplate): void;
  (e: "save", value: ComponentDef | FormTemplate): void;
  (e: "cancel"): void;
  (e: "preview", value: ComponentDef | FormTemplate): void;
}

/** FormRenderer props */
export interface FormRendererProps {
  component: FormTemplate;
  formData?: Record<string, any>;
  /**
   * 输入控件在单元格内的宽度
   * - string：CSS width 值（如 '100%'、'320px'、'20rem'）
   * - number：像素值（如 320 → '320px'）
   * 默认 '100%'，可用 props 覆盖
   */
  componentWidth?: string | number;
}

/** FormRenderer emits */
export interface FormRendererEmits {
  (e: "update:formData", data: Record<string, any>): void;
  (e: "field-change", payload: { field: string; value: any }): void;
}
