/**
 * Demo 模拟数据 — 结构对应 KnowCustomItemIndicator.java
 */
import { parseComponentJson, injectProps, serializeComponentJson, extractProps, serializeRuleExpress } from '@/components/form-designer'
import type { ComponentDef } from '@/components/form-designer/types'

export interface IndicatorRecord {
  indicatorId: string;
  indicatorName: string;
  fieldId: string;
  fieldType: string;
  componentType: string;
  /** 是否必填 1=是 0=否 */
  requireFlag: string;
  indicatorUnit: string;
  indicatorAbbr: string;
  indicatorReferenceVal: string;
  inputMaxVal: string | number;
  inputMinVal: string | number;
  fieldEnumJson: string;
  fieldLength: string | number;
  /** 前端组件 JSON 串 */
  fieldComponentFrontJson: string;
  indicatorCustomCategoryLabel: string;
  fieldValExpress: string;
  fieldValPrecision: string | number;
}

/** 业务侧 mapping：IndicatorRecord 平铺字段 → ComponentDef.props 键 */
const PROPS_MAPPING: Record<string, string> = {
  indicatorCustomCategoryLabel: 'categoryLabel',
  inputMaxVal: 'max',
  inputMinVal: 'min',
  fieldLength: 'maxLength',
  fieldValPrecision: 'precision'
}

/** PROPS_MAPPING 的反向：ComponentDef.props 键 → IndicatorRecord 平铺字段 */
const REVERSE_PROPS_MAPPING: Record<string, string> = {
  categoryLabel: 'indicatorCustomCategoryLabel',
  max: 'inputMaxVal',
  min: 'inputMinVal',
  maxLength: 'fieldLength',
  precision: 'fieldValPrecision'
}

/** antd 组件类型 → Java fieldType */
const TYPE_TO_FIELD_TYPE: Record<string, string> = {
  Input: 'string',
  InputNumber: 'number',
  Textarea: 'string',
  Select: 'string',
  RadioGroup: 'string',
  CheckboxGroup: 'string',
  DatePicker: 'date',
  TimePicker: 'time',
  Switch: 'boolean',
  DisplayText: 'string',
  Upload: 'string'
}

/** 解析 fieldComponentFrontJson，并按业务 mapping 注入平铺字段到 props */
export function parseComponent(r: IndicatorRecord): ComponentDef {
  const def = parseComponentJson(r.fieldComponentFrontJson)
  return injectProps(def, r, PROPS_MAPPING)
}

/**
 * 反向：ComponentDef → IndicatorRecord
 * 用于保存字段时把设计器数据转成后端接口参数。
 * @param def 当前编辑的 ComponentDef
 * @param base 编辑场景传入已有记录（保留 indicatorId 等不可变字段），新建场景传空对象
 */
export function toIndicatorRecord(
  def: ComponentDef,
  base: Partial<IndicatorRecord> = {}
): IndicatorRecord {
  // 从 def.props 反向提取平铺字段
  const flat = extractProps(def, REVERSE_PROPS_MAPPING)

  // 把所有启用的规则序列化为 JSON 表达式串，喂给 fieldValExpress
  const fieldValExpress = serializeRuleExpress(def.rules ?? [])

  return {
    indicatorId: def.id || base.indicatorId || '',
    indicatorName: def.label,
    fieldId: def.field || '',
    fieldType: TYPE_TO_FIELD_TYPE[def.type] ?? 'string',
    componentType: def.type,
    requireFlag: def.required ? '1' : '0',
    indicatorUnit: def.unit ?? '',
    indicatorAbbr: '',
    indicatorReferenceVal: '',
    inputMaxVal: flat.inputMaxVal ?? '',
    inputMinVal: flat.inputMinVal ?? '',
    fieldEnumJson: def.options?.length ? JSON.stringify(def.options) : '',
    fieldLength: flat.fieldLength ?? '',
    fieldComponentFrontJson: serializeComponentJson(def),
    indicatorCustomCategoryLabel: flat.indicatorCustomCategoryLabel ?? '',
    fieldValExpress: fieldValExpress ?? '',
    fieldValPrecision: flat.fieldValPrecision ?? ''
  }
}

export const demoFields: IndicatorRecord[] = [
  // ----- 基础信息 -----
  {
    indicatorId: "1001",
    indicatorName: "患者姓名",
    fieldId: "patientName",
    fieldType: "string",
    componentType: "Input",
    requireFlag: "1",
    indicatorUnit: "",
    indicatorAbbr: "",
    indicatorReferenceVal: "",
    inputMaxVal: "",
    inputMinVal: "",
    fieldEnumJson: "",
    fieldLength: 50,
    fieldComponentFrontJson: JSON.stringify({
      id: "1001",
      type: "Input",
      field: "patientName",
      label: "患者姓名",
      required: true,
      props: { placeholder: "请输入姓名", maxLength: 50 },
    }),
    indicatorCustomCategoryLabel: "基础信息",
    fieldValExpress: "",
    fieldValPrecision: "",
  },
  {
    indicatorId: "1002",
    indicatorName: "性别",
    fieldId: "gender",
    fieldType: "enum",
    componentType: "RadioGroup",
    requireFlag: "1",
    indicatorUnit: "",
    indicatorAbbr: "",
    indicatorReferenceVal: "",
    inputMaxVal: "",
    inputMinVal: "",
    fieldEnumJson: JSON.stringify([
      { label: "男", value: "male" },
      { label: "女", value: "female" },
    ]),
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "1002",
      type: "RadioGroup",
      field: "gender",
      label: "性别",
      required: true,
      options: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
      ],
    }),
    indicatorCustomCategoryLabel: "基础信息",
    fieldValExpress: "",
    fieldValPrecision: "",
  },
  {
    indicatorId: "1003",
    indicatorName: "年龄",
    fieldId: "age",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "1",
    indicatorUnit: "岁",
    indicatorAbbr: "",
    indicatorReferenceVal: "",
    inputMaxVal: 150,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "1003",
      type: "InputNumber",
      field: "age",
      label: "年龄",
      required: true,
      unit: "岁",
      props: { min: 0, max: 150, precision: 0, placeholder: "请输入年龄" },
    }),
    indicatorCustomCategoryLabel: "基础信息",
    fieldValExpress: "",
    fieldValPrecision: 0,
  },
  {
    indicatorId: "1004",
    indicatorName: "检查日期",
    fieldId: "examDate",
    fieldType: "date",
    componentType: "DatePicker",
    requireFlag: "1",
    indicatorUnit: "",
    indicatorAbbr: "",
    indicatorReferenceVal: "",
    inputMaxVal: "",
    inputMinVal: "",
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "1004",
      type: "DatePicker",
      field: "examDate",
      label: "检查日期",
      required: true,
      props: { placeholder: "请选择日期" },
    }),
    indicatorCustomCategoryLabel: "基础信息",
    fieldValExpress: "",
    fieldValPrecision: "",
  },

  // ----- 血液检查 -----
  {
    indicatorId: "2001",
    indicatorName: "白细胞计数",
    fieldId: "wbc",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "1",
    indicatorUnit: "10⁹/L",
    indicatorAbbr: "WBC",
    indicatorReferenceVal: "4.0-10.0",
    inputMaxVal: 100,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "2001",
      type: "InputNumber",
      field: "wbc",
      label: "白细胞计数",
      unit: "10⁹/L",
      required: true,
      props: { min: 0, max: 100, precision: 2, placeholder: "请输入" },
      rules: [
        {
          id: "rule_wbc_threshold",
          type: "threshold",
          name: "白细胞分级",
          enabled: true,
          trigger: "onChange",
          params: {
            ranges: [
              {
                min: null,
                max: 4,
                label: "偏低",
                level: "low",
                color: "#52c41a",
              },
              {
                min: 4,
                max: 10,
                label: "正常",
                level: "normal",
                color: "#1890ff",
              },
              {
                min: 10,
                max: null,
                label: "偏高",
                level: "high",
                color: "#f5222d",
              },
            ],
            actions: [
              { type: "setText", target: "$.self.suffix", value: "$label" },
            ],
          },
        },
      ],
    }),
    indicatorCustomCategoryLabel: "血液检查",
    fieldValExpress: "",
    fieldValPrecision: 2,
  },
  {
    indicatorId: "2002",
    indicatorName: "红细胞计数",
    fieldId: "rbc",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "1",
    indicatorUnit: "10¹²/L",
    indicatorAbbr: "RBC",
    indicatorReferenceVal: "3.5-5.5",
    inputMaxVal: 20,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "2002",
      type: "InputNumber",
      field: "rbc",
      label: "红细胞计数",
      unit: "10¹²/L",
      required: true,
      props: { min: 0, max: 20, precision: 2, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "血液检查",
    fieldValExpress: "",
    fieldValPrecision: 2,
  },
  {
    indicatorId: "2003",
    indicatorName: "血红蛋白",
    fieldId: "hgb",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "1",
    indicatorUnit: "g/L",
    indicatorAbbr: "HGB",
    indicatorReferenceVal: "120-160",
    inputMaxVal: 300,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "2003",
      type: "InputNumber",
      field: "hgb",
      label: "血红蛋白",
      unit: "g/L",
      required: true,
      props: { min: 0, max: 300, precision: 1, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "血液检查",
    fieldValExpress: "",
    fieldValPrecision: 1,
  },
  {
    indicatorId: "2004",
    indicatorName: "血小板计数",
    fieldId: "plt",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "1",
    indicatorUnit: "10⁹/L",
    indicatorAbbr: "PLT",
    indicatorReferenceVal: "100-300",
    inputMaxVal: 1000,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "2004",
      type: "InputNumber",
      field: "plt",
      label: "血小板计数",
      unit: "10⁹/L",
      required: true,
      props: { min: 0, max: 1000, precision: 1, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "血液检查",
    fieldValExpress: "",
    fieldValPrecision: 1,
  },
  {
    indicatorId: "2005",
    indicatorName: "红细胞压积",
    fieldId: "hct",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "0",
    indicatorUnit: "%",
    indicatorAbbr: "HCT",
    indicatorReferenceVal: "35-50",
    inputMaxVal: 100,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "2005",
      type: "InputNumber",
      field: "hct",
      label: "红细胞压积",
      unit: "%",
      props: { min: 0, max: 100, precision: 2, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "血液检查",
    fieldValExpress: "",
    fieldValPrecision: 2,
  },

  // ----- 肝功能 -----
  {
    indicatorId: "3001",
    indicatorName: "总胆红素",
    fieldId: "tbil",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "1",
    indicatorUnit: "μmol/L",
    indicatorAbbr: "TBIL",
    indicatorReferenceVal: "0-17.1",
    inputMaxVal: 500,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "3001",
      type: "InputNumber",
      field: "tbil",
      label: "总胆红素",
      unit: "μmol/L",
      required: true,
      props: { min: 0, max: 500, precision: 2, placeholder: "请输入" },
      rules: [
        {
          id: "rule_tbil_threshold",
          type: "threshold",
          name: "总胆红素分级",
          enabled: true,
          trigger: "onChange",
          params: {
            ranges: [
              {
                min: null,
                max: 17.1,
                label: "正常",
                level: "normal",
                color: "#1890ff",
              },
              {
                min: 17.1,
                max: 34.2,
                label: "隐性黄疸",
                level: "low",
                color: "#faad14",
              },
              {
                min: 34.2,
                max: null,
                label: "明显黄疸",
                level: "high",
                color: "#f5222d",
              },
            ],
            actions: [
              { type: "setText", target: "$.self.suffix", value: "$label" },
            ],
          },
        },
      ],
    }),
    indicatorCustomCategoryLabel: "肝功能",
    fieldValExpress: "",
    fieldValPrecision: 2,
  },
  {
    indicatorId: "3002",
    indicatorName: "直接胆红素",
    fieldId: "dbil",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "0",
    indicatorUnit: "μmol/L",
    indicatorAbbr: "DBIL",
    indicatorReferenceVal: "0-6.8",
    inputMaxVal: 200,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "3002",
      type: "InputNumber",
      field: "dbil",
      label: "直接胆红素",
      unit: "μmol/L",
      props: { min: 0, max: 200, precision: 2, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "肝功能",
    fieldValExpress: "",
    fieldValPrecision: 2,
  },
  {
    indicatorId: "3003",
    indicatorName: "谷丙转氨酶",
    fieldId: "alt",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "0",
    indicatorUnit: "U/L",
    indicatorAbbr: "ALT",
    indicatorReferenceVal: "0-40",
    inputMaxVal: 5000,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "3003",
      type: "InputNumber",
      field: "alt",
      label: "谷丙转氨酶",
      unit: "U/L",
      props: { min: 0, max: 5000, precision: 1, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "肝功能",
    fieldValExpress: "",
    fieldValPrecision: 1,
  },
  {
    indicatorId: "3004",
    indicatorName: "谷草转氨酶",
    fieldId: "ast",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "0",
    indicatorUnit: "U/L",
    indicatorAbbr: "AST",
    indicatorReferenceVal: "0-40",
    inputMaxVal: 5000,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "3004",
      type: "InputNumber",
      field: "ast",
      label: "谷草转氨酶",
      unit: "U/L",
      props: { min: 0, max: 5000, precision: 1, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "肝功能",
    fieldValExpress: "",
    fieldValPrecision: 1,
  },
  {
    indicatorId: "3005",
    indicatorName: "总蛋白",
    fieldId: "tp",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "0",
    indicatorUnit: "g/L",
    indicatorAbbr: "TP",
    indicatorReferenceVal: "60-80",
    inputMaxVal: 200,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "3005",
      type: "InputNumber",
      field: "tp",
      label: "总蛋白",
      unit: "g/L",
      props: { min: 0, max: 200, precision: 1, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "肝功能",
    fieldValExpress: "",
    fieldValPrecision: 1,
  },
  {
    indicatorId: "3006",
    indicatorName: "白蛋白",
    fieldId: "alb",
    fieldType: "number",
    componentType: "InputNumber",
    requireFlag: "0",
    indicatorUnit: "g/L",
    indicatorAbbr: "ALB",
    indicatorReferenceVal: "35-55",
    inputMaxVal: 100,
    inputMinVal: 0,
    fieldEnumJson: "",
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "3006",
      type: "InputNumber",
      field: "alb",
      label: "白蛋白",
      unit: "g/L",
      props: { min: 0, max: 100, precision: 1, placeholder: "请输入" },
    }),
    indicatorCustomCategoryLabel: "肝功能",
    fieldValExpress: "",
    fieldValPrecision: 1,
  },

  // ----- 其他 -----
  {
    indicatorId: "4001",
    indicatorName: "标本类型",
    fieldId: "sampleType",
    fieldType: "enum",
    componentType: "Select",
    requireFlag: "0",
    indicatorUnit: "",
    indicatorAbbr: "",
    indicatorReferenceVal: "",
    inputMaxVal: "",
    inputMinVal: "",
    fieldEnumJson: JSON.stringify([
      { label: "静脉血", value: "venous_blood" },
      { label: "末梢血", value: "capillary_blood" },
      { label: "动脉血", value: "arterial_blood" },
      { label: "尿液", value: "urine" },
      { label: "粪便", value: "stool" },
    ]),
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "4001",
      type: "Select",
      field: "sampleType",
      label: "标本类型",
      options: [
        { label: "静脉血", value: "venous_blood" },
        { label: "末梢血", value: "capillary_blood" },
        { label: "动脉血", value: "arterial_blood" },
        { label: "尿液", value: "urine" },
        { label: "粪便", value: "stool" },
      ],
      props: { placeholder: "请选择标本类型" },
    }),
    indicatorCustomCategoryLabel: "其他",
    fieldValExpress: "",
    fieldValPrecision: "",
  },
  {
    indicatorId: "4002",
    indicatorName: "检查状态",
    fieldId: "examStatus",
    fieldType: "enum",
    componentType: "Select",
    requireFlag: "0",
    indicatorUnit: "",
    indicatorAbbr: "",
    indicatorReferenceVal: "",
    inputMaxVal: "",
    inputMinVal: "",
    fieldEnumJson: JSON.stringify([
      { label: "已申请", value: "applied" },
      { label: "已采样", value: "sampled" },
      { label: "检测中", value: "testing" },
      { label: "已完成", value: "completed" },
      { label: "已审核", value: "reviewed" },
    ]),
    fieldLength: "",
    fieldComponentFrontJson: JSON.stringify({
      id: "4002",
      type: "Select",
      field: "examStatus",
      label: "检查状态",
      options: [
        { label: "已申请", value: "applied" },
        { label: "已采样", value: "sampled" },
        { label: "检测中", value: "testing" },
        { label: "已完成", value: "completed" },
        { label: "已审核", value: "reviewed" },
      ],
      props: { placeholder: "请选择状态" },
    }),
    indicatorCustomCategoryLabel: "其他",
    fieldValExpress: "",
    fieldValPrecision: "",
  },
  {
    indicatorId: "4003",
    indicatorName: "备注",
    fieldId: "remark",
    fieldType: "string",
    componentType: "Textarea",
    requireFlag: "0",
    indicatorUnit: "",
    indicatorAbbr: "",
    indicatorReferenceVal: "",
    inputMaxVal: "",
    inputMinVal: "",
    fieldEnumJson: "",
    fieldLength: 500,
    fieldComponentFrontJson: JSON.stringify({
      id: "4003",
      type: "Textarea",
      field: "remark",
      label: "备注",
      props: {
        placeholder: "请输入备注信息",
        maxLength: 500,
        rows: 3,
        showCount: true,
      },
    }),
    indicatorCustomCategoryLabel: "其他",
    fieldValExpress: "",
    fieldValPrecision: "",
  },
];

export const columns = [
  {
    title: "指标名称",
    dataIndex: "indicatorName",
    key: "indicatorName",
    width: 150,
  },
  {
    title: "缩写",
    dataIndex: "indicatorAbbr",
    key: "indicatorAbbr",
    width: 70,
  },
  {
    title: "组件类型",
    dataIndex: "componentType",
    key: "componentType",
    width: 100,
  },
  { title: "字段标识", dataIndex: "fieldId", key: "fieldId", width: 130 },
  {
    title: "必填",
    dataIndex: "requireFlag",
    key: "requireFlag",
    width: 60,
    align: "center" as const,
  },
  {
    title: "单位",
    dataIndex: "indicatorUnit",
    key: "indicatorUnit",
    width: 80,
  },
  {
    title: "参考值",
    dataIndex: "indicatorReferenceVal",
    key: "indicatorReferenceVal",
    width: 110,
  },
  {
    title: "分类",
    dataIndex: "indicatorCustomCategoryLabel",
    key: "categoryLabel",
    width: 100,
  },
  { title: "操作", key: "actions", width: 80 },
];

// --------------- 拼音首字母检索 ---------------
const CHAR_PY: Record<string, string> = {
  患:'h',者:'z',姓:'x',名:'m',性:'x',别:'b',年:'n',龄:'l',检:'j',查:'c',日:'r',期:'q',
  白:'b',细:'x',胞:'b',计:'j',数:'s',红:'h',血:'x',蛋:'d',小:'x',板:'b',压:'y',积:'j',
  总:'z',胆:'d',素:'s',直:'z',接:'j',谷:'g',丙:'b',转:'z',氨:'a',酶:'m',草:'c',
  标:'b',本:'b',类:'l',型:'x',状:'z',态:'t',备:'b',注:'z',肝:'g',功:'g',尿:'n',液:'y',
  动:'d',脉:'m',末:'m',梢:'s',粪:'f',便:'b',静:'j',已:'y',申:'s',请:'q',采:'c',样:'y',
  测:'c',完:'w',成:'c',审:'s',核:'h',球:'q',工:'g',能:'n',项:'x',目:'m',
  单:'d',位:'w',参:'c',考:'k',值:'z',录:'l',入:'r',据:'j',枚:'m',举:'j',达:'d',表:'b',
  式:'s',精:'j',度:'d',启:'q',用:'y',删:'s',除:'c',志:'z',自:'z',定:'d',
  义:'y',分:'f',前:'q',端:'d',组:'z',件:'j',编:'b',号:'h',缩:'s',写:'x',常:'c'
}
function toPinyin(text: string): string {
  let r = ''
  for (const ch of text) r += CHAR_PY[ch] || ch.toLowerCase()
  return r
}

/** 供 PresetsLibrary searchFn 使用的拼音检索函数 */
export const presetSearchFn = (item: ComponentDef, kw: string) => {
  if (item.label.includes(kw) || item.field.toLowerCase().includes(kw)) return true
  return toPinyin(item.label).includes(kw)
}

// --------------- 补全 demo 数据中的 fieldValExpress ---------------
// 遍历 demoFields，对有 rules 的字段自动计算 fieldValExpress
demoFields.forEach(f => {
  if (f.fieldComponentFrontJson) {
    try {
      const def: ComponentDef = JSON.parse(f.fieldComponentFrontJson)
      if (def.rules?.length) {
        f.fieldValExpress = serializeRuleExpress(def.rules) ?? ''
      }
    } catch { /* JSON 解析失败则保持原值 */ }
  }
})

// --------------- Demo 打印：正向解析 + 反向转换 ---------------
if (typeof window !== 'undefined') {
  console.log('========== 正向：IndicatorRecord → ComponentDef ==========')
  // 取白细胞计数（有 rules 的字段）
  const wbc = demoFields.find(f => f.indicatorId === '2001')!
  const parsed = parseComponent(wbc)
  console.log('【原始 IndicatorRecord】', JSON.stringify(wbc, null, 2))
  console.log('【parseComponent → ComponentDef】', JSON.stringify(parsed, null, 2))
  console.log('【fieldValExpress（规则表达式串）】', wbc.fieldValExpress)

  console.log('========== 反向：ComponentDef → IndicatorRecord ==========')
  const back = toIndicatorRecord(parsed, { indicatorId: wbc.indicatorId })
  console.log('【toIndicatorRecord → IndicatorRecord】', JSON.stringify(back, null, 2))

  console.log('========== 取第二个 demo（无 rules 的字段）==========')
  const gender = demoFields.find(f => f.indicatorId === '1002')!
  const parsed2 = parseComponent(gender)
  console.log('【parseComponent → ComponentDef（无规则）】', JSON.stringify(parsed2, null, 2))
  console.log('【fieldValExpress（无 rules）】', gender.fieldValExpress) // null

  const back2 = toIndicatorRecord(parsed2, { indicatorId: '1002' })
  console.log('【toIndicatorRecord（无 rules）】', JSON.stringify(back2, null, 2))
}
