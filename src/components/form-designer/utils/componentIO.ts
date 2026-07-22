/**
 * ComponentDef 输入输出工具集
 *
 * 核心定位：把"后端接口数据 ←→ 前端设计器组件对象"这条双向链路拆成可组合的纯函数，
 * 让业务方按需拼装，避免把 Java 字段名（indicatorCustomCategoryLabel 等）绑死在通用工具里。
 *
 * 完整用法示例（正向：接口数据 → ComponentDef）：
 * ```ts
 * import { parseComponentJson, injectProps } from '@/components/form-designer'
 *
 * // 1. 解析接口返回的 JSON 字符串
 * const def = parseComponentJson(apiRecord.fieldComponentFrontJson)
 * //    → { id: "1001", type: "Input", field: "patientName", label: "患者姓名", props: { placeholder: "请输入" } }
 *
 * // 2. 按 mapping 把平铺字段注入到 props
 * const final = injectProps(def, apiRecord, {
 *   indicatorCustomCategoryLabel: 'categoryLabel',  // Java 侧字段名 → 前端 props 键
 *   inputMaxVal: 'max',
 *   fieldLength: 'maxLength',
 *   fieldValPrecision: 'precision'
 * })
 * //    → { ...def, props: { placeholder: "请输入", categoryLabel: "基础信息", max: 100, maxLength: 50, precision: 2 } }
 * ```
 *
 * 完整用法示例（反向：ComponentDef → 接口数据）：
 * ```ts
 * import { extractProps, serializeComponentJson, serializeRuleExpress } from '@/components/form-designer'
 *
 * // 1. 从 props 反向抽平铺字段
 * const flat = extractProps(def, {
 *   categoryLabel: 'indicatorCustomCategoryLabel',
 *   max: 'inputMaxVal',
 *   maxLength: 'fieldLength',
 *   precision: 'fieldValPrecision'
 * })
 * //    → { indicatorCustomCategoryLabel: "基础信息", inputMaxVal: 100, fieldLength: 50, fieldValPrecision: 2 }
 *
 * // 2. 序列化整个组件对象
 * const json = serializeComponentJson(def)  // → '{"id":"1001","type":"Input",...}'
 *
 * // 3. 序列化规则列表
 * const express = serializeRuleExpress(def.rules ?? [])
 * //    → '[{"type":"validation","trigger":"onBlur","params":{...}},{"type":"calculation","trigger":"onChange","params":{...}}]'
 * ```
 */
import type { ComponentDef, RuleDef } from '../types'

/**
 * 把接口返回的 JSON 字符串解析为 ComponentDef。
 *
 * 典型场景：后端返回字段列表时，每个字段的 `fieldComponentFrontJson`
 * 是存了组件定义的 JSON 字符串，调这个函数还原成 ComponentDef 对象。
 *
 * @example
 * // 正常解析
 * parseComponentJson('{"id":"1001","type":"Input","field":"patientName","label":"患者姓名"}')
 * // → { id: "1001", type: "Input", field: "patientName", label: "患者姓名" }
 *
 * @example
 * // 空串 → 兜底空壳
 * parseComponentJson('')
 * // → { id: '', type: 'Input', field: '', label: '' }
 *
 * @example
 * // 坏 JSON → 兜底空壳（不会抛异常打断业务流）
 * parseComponentJson('{broken json')
 * // → { id: '', type: 'Input', field: '', label: '' }
 */
export function parseComponentJson(json: string): ComponentDef {
  if (!json) return { id: '', type: 'Input', field: '', label: '' }
  try {
    return JSON.parse(json) as ComponentDef
  } catch {
    return { id: '', type: 'Input', field: '', label: '' }
  }
}

/**
 * 按 mapping 把 source 的平铺字段注入到 def.props。
 *
 * 典型场景：后端接口返回的字段有很多平铺列（如 inputMaxVal、fieldLength 等），
 * 但 ComponentDef 用 `props: Record<string, any>` 承载这些扩展属性。
 * 这个函数把平铺字段按 mapping 映射后合并进 props，避免手动逐行赋值。
 *
 * @param def  已有的 ComponentDef（通常是 parseComponentJson 的返回值）
 * @param source  后端返回的平铺字段对象（如 apiRecord）
 * @param mapping  key = source 字段名，value = 写入 def.props 后的键名
 *
 * @example
 * const def = { id: "1001", type: "Input", field: "name", label: "姓名", props: { placeholder: "请输入" } }
 * const source = { indicatorCustomCategoryLabel: "基础信息", inputMaxVal: 100, inputMinVal: null }
 *
 * injectProps(def, source, {
 *   indicatorCustomCategoryLabel: 'categoryLabel',
 *   inputMaxVal: 'max',
 *   inputMinVal: 'min'
 * })
 * // → { id: "1001", type: "Input", ..., props: { placeholder: "请输入", categoryLabel: "基础信息", max: 100 } }
 * //   注：inputMinVal 为 null，被跳过；min 不会出现在 props 中
 */
export function injectProps(
  def: ComponentDef,
  source: Record<string, any>,
  mapping: Record<string, string>
): ComponentDef {
  const props = { ...(def.props ?? {}) }
  for (const [srcKey, targetKey] of Object.entries(mapping)) {
    const v = source[srcKey]
    if (v != null) {
      ;(props as Record<string, any>)[targetKey] = v
    }
  }
  return { ...def, props }
}

/**
 * 把 ComponentDef 序列化为 JSON 字符串。
 *
 * 典型场景：保存字段时，需要把设计器中的组件对象序列化后填入
 * `fieldComponentFrontJson` 字段传给后端存储。
 *
 * @example
 * const def = { id: "1001", type: "Input", field: "name", label: "姓名", required: true }
 * serializeComponentJson(def)
 * // → '{"id":"1001","type":"Input","field":"name","label":"姓名","required":true}'
 */
export function serializeComponentJson(def: ComponentDef): string {
  return JSON.stringify(def)
}

/**
 * injectProps 的反向操作：按 mapping 从 def.props 提取字段到平铺对象。
 *
 * 典型场景：保存字段时，后端接口期望平铺的字段（如 inputMaxVal、fieldLength 等），
 * 而不是嵌套在 props 里。这个函数把 props 里的值按 mapping 反向映射到平铺字段。
 *
 * @param def       ComponentDef 对象
 * @param mapping   key = def.props 里的键名，value = 输出对象的字段名
 *
 * @example
 * const def = {
 *   id: "1001", type: "Input", field: "name", label: "姓名",
 *   props: { placeholder: "请输入", categoryLabel: "基础信息", max: 100 }
 * }
 *
 * extractProps(def, {
 *   categoryLabel: 'indicatorCustomCategoryLabel',
 *   max: 'inputMaxVal',
 *   min: 'inputMinVal'
 * })
 * // → { indicatorCustomCategoryLabel: "基础信息", inputMaxVal: 100 }
 * //   注：min 在 props 中不存在（undefined），不会出现在结果中
 */
export function extractProps(
  def: ComponentDef,
  mapping: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {}
  const props = def.props ?? {}
  for (const [propKey, targetKey] of Object.entries(mapping)) {
    const v = (props as Record<string, any>)[propKey]
    if (v !== undefined) {
      result[targetKey] = v
    }
  }
  return result
}

/**
 * 把规则列表序列化为表达式 JSON 串，供后端的 `fieldValExpress` 字段使用。
 *
 * 典型场景：保存字段时，需要把设计器中配置的全部校验 + 业务规则
 * 统一序列化到一个字符串字段传给后端，Java 侧用 Jackson 反序列化即可逐条执行。
 *
 * 处理规则：
 * - 过滤掉 `enabled: false` 的禁用规则（不传给后端）
 * - 去掉前端专用字段（id / name / enabled），只保留 type / trigger / params
 * - 无启用规则时返回 null
 *
 * @example
 * // 输入：3 条规则（1 条校验 + 1 条计算 + 1 条已禁用的阈值）
 * const rules = [
 *   { id: "r1", type: "validation", name: "必填校验", enabled: true, trigger: "onBlur",
 *     params: { validators: [{ type: "required", message: "不能为空" }] } },
 *   { id: "r2", type: "calculation", name: "BMI 计算", enabled: true, trigger: "onChange",
 *     params: { template: "custom", expression: "$.components.weight.value / ($.components.height.value ^ 2)", precision: 1 } },
 *   { id: "r3", type: "threshold", name: "白细胞分级", enabled: false, trigger: "onChange",
 *     params: { ranges: [], actions: [] } }
 * ]
 *
 * serializeRuleExpress(rules)
 * // → '[{"type":"validation","trigger":"onBlur","params":{"validators":[{"type":"required","message":"不能为空"}]}},{"type":"calculation","trigger":"onChange","params":{"template":"custom","expression":"$.components.weight.value / ($.components.height.value ^ 2)","precision":1}}]'
 * //   注：r3 被过滤（enabled: false），r1/r2 的 id/name/enabled 被去掉
 *
 * @example
 * // 无规则或全部禁用
 * serializeRuleExpress([])          // → null
 * serializeRuleExpress([{ ..., enabled: false }])  // → null
 */
export function serializeRuleExpress(rules: RuleDef[]): string | null {
  const enabled = rules.filter(r => r.enabled !== false)
  if (enabled.length === 0) return null
  return JSON.stringify(enabled.map(r => ({
    type: r.type,
    trigger: r.trigger,
    params: r.params
  })))
}
