/**
 * 组件 CRUD 工具函数。
 * 渲染器已改为 Table 模式，模板 components 是扁平数组，不再支持嵌套容器组件。
 */
import type { ComponentDef, RuleDef } from '@/types/template'
import { uid } from './uid'

/**
 * 按 id 查找组件（扁平数组，仅查顶层）
 */
export function findComponentById(comps: ComponentDef[], id: string): ComponentDef | null {
  return comps.find(c => c.id === id) || null
}

/**
 * 删除组件（原地修改 comps 数组）
 */
export function removeComponentById(comps: ComponentDef[], id: string): boolean {
  const idx = comps.findIndex(c => c.id === id)
  if (idx >= 0) {
    comps.splice(idx, 1)
    return true
  }
  return false
}

/**
 * 更新组件字段
 */
export function updateComponentById(comps: ComponentDef[], id: string, patch: Partial<ComponentDef>): boolean {
  const c = comps.find(c => c.id === id)
  if (c) {
    Object.assign(c, patch)
    return true
  }
  return false
}

/**
 * 深拷贝组件并生成新 id，规则中的 $.components.{oldId} 引用也重写。
 */
export function deepCloneComponent(comp: ComponentDef): ComponentDef {
  const idMap = new Map<string, string>()
  const newId = uid('comp_')
  idMap.set(comp.id, newId)

  const rewriteRefs = (rule: RuleDef): RuleDef => {
    const str = JSON.stringify(rule)
    const replaced = str.replace(
      /\$\.components\.([a-zA-Z0-9_]+)/g,
      (_match, oldId) => {
        const mapped = idMap.get(oldId)
        return mapped ? `$.components.${mapped}` : _match
      }
    )
    return JSON.parse(replaced)
  }

  return {
    ...comp,
    id: newId,
    field: comp.field + '_copy',
    label: comp.label + ' (副本)',
    rules: comp.rules.map(rewriteRefs)
  }
}