/**
 * 当前编辑中的模板 store
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { FormTemplate, ComponentDef, RuleDef } from '@/types/template'
import { templateApi } from '@/api/templateApi'
import { findComponentById, removeComponentById, updateComponentById } from '@/utils/componentTree'

export const useTemplateStore = defineStore('template', () => {
  const template = ref<FormTemplate | null>(null)
  const selectedComponentId = ref<string | null>(null)

  const selectedComponent = computed<ComponentDef | null>(() => {
    if (!template.value || !selectedComponentId.value) return null
    return findComponentById(template.value.components, selectedComponentId.value)
  })

  /** 渲染器已改为 Table 模式，layout 只保留 { type: 'form' } 标识。历史字段全部清理。 */
  function migrateLayout(layout: any): void {
    if (!layout) return
    delete layout.labelPosition
    delete layout.labelWidth
    delete layout.layout
    delete layout.labelSpan
    delete layout.columns
  }

  /**
   * 渲染器已改为 Table 模式，每个组件独占一行，组件 columns / labelSpan / children 不再需要。
   * 历史数据统一删除。
   */
  function migrateComponentColumns(comp: any): void {
    if (!comp) return
    delete comp.columns
    delete comp.labelSpan
    delete comp.children
  }

  /** 对旧模板执行一次性迁移（12 栅格 → 24 栅格、旧字段名 → 新字段名） */
  function ensureMigrated() {
    const layout = template.value?.layout as any
    // layout._migrated 标记防止每次 load 都重复迁移，覆盖用户手动设置的值
    if (layout?._migrated) return
    if (template.value) {
      migrateLayout(template.value.layout)
      template.value.components.forEach(migrateComponentColumns)
      if (template.value.layout) {
        ;(template.value.layout as any)._migrated = true
      }
    }
  }

  function load(id: string) {
    const t = templateApi.get(id)
    if (!t) throw new Error(`模板 ${id} 不存在`)
    template.value = JSON.parse(JSON.stringify(t))
    ensureMigrated()
    selectedComponentId.value = template.value.components[0]?.id || null
  }

  function setTemplate(t: FormTemplate) {
    template.value = JSON.parse(JSON.stringify(t))
    ensureMigrated()
    selectedComponentId.value = template.value.components[0]?.id || null
  }

  function save() {
    if (!template.value) return
    templateApi.update(template.value)
  }

  function updateTemplateMeta(patch: Partial<Pick<FormTemplate, 'name' | 'category' | 'description' | 'layout'>>) {
    if (!template.value) return
    Object.assign(template.value, patch)
  }

  function addComponent(comp: ComponentDef) {
    if (!template.value) return
    template.value.components.push(comp)
    selectedComponentId.value = comp.id
  }

  function removeComponent(id: string) {
    if (!template.value) return
    removeComponentById(template.value.components, id)
    if (selectedComponentId.value === id) {
      const first = findComponentById(template.value.components, template.value.components[0]?.id)
      selectedComponentId.value = first?.id || null
    }
  }

  function duplicateComponent(id: string) {
    // 现在由 DesignerCanvas 直接处理（需要深拷贝+ID重写）
    // 保留此方法作为简单场景的兼容
    if (!template.value) return
    const src = findComponentById(template.value.components, id)
    if (!src) return
    const copy: ComponentDef = JSON.parse(JSON.stringify(src))
    copy.id = src.id + '_copy'
    copy.field = src.field + '_copy'
    copy.label = src.label + ' (副本)'
    copy.rules = []
    if (copy.children) copy.children = []
    template.value.components.push(copy)
    selectedComponentId.value = copy.id
  }

  function updateComponent(id: string, patch: Partial<ComponentDef>) {
    if (!template.value) return
    updateComponentById(template.value.components, id, patch)
  }

  function reorderComponents(newList: ComponentDef[]) {
    if (!template.value) return
    template.value.components = newList
  }

  function addRule(componentId: string, rule: RuleDef) {
    if (!template.value) return
    const c = findComponentById(template.value.components, componentId)
    if (c) c.rules.push(rule)
  }

  function updateRule(componentId: string, ruleId: string, patch: Partial<RuleDef>) {
    if (!template.value) return
    const c = findComponentById(template.value.components, componentId)
    const r = c?.rules.find(r => r.id === ruleId)
    if (r) Object.assign(r, patch)
  }

  function removeRule(componentId: string, ruleId: string) {
    if (!template.value) return
    const c = findComponentById(template.value.components, componentId)
    if (!c) return
    c.rules = c.rules.filter(r => r.id !== ruleId)
  }

  // 自动持久化：template 任何字段变更后防抖 500ms 写入 localStorage
  // 让 addRule / updateRule / removeRule / addComponent 等所有 mutation 无需手动点保存
  // 深拷贝传参，避免 templateApi.update 修改 updatedAt 触发再次 watch
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    template,
    (t) => {
      if (!t) return
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        templateApi.update(JSON.parse(JSON.stringify(t)))
      }, 500)
    },
    { deep: true }
  )

  return {
    template,
    selectedComponentId,
    selectedComponent,
    load,
    setTemplate,
    save,
    updateTemplateMeta,
    addComponent,
    removeComponent,
    duplicateComponent,
    updateComponent,
    reorderComponents,
    addRule,
    updateRule,
    removeRule
  }
})