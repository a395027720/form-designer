/**
 * 模板存储 API（纯内存版）
 *
 * 注：原本走 localStorage 持久化，但用户真实需求是后端接口保存。
 * 这里改成 module-singleton 内存数据，刷新即丢。保存时由 page 层
 * 把 JSON 通过回调直接交给调用方，由其转发到后端。
 *
 * 保留 sampleTemplates 注入是为了让 TemplateList 首次访问能看到示例。
 */
import type { FormTemplate, ComponentDef, RuleDef } from '@/components/form-designer/types'
import { uid } from '@/components/form-designer/utils/uid'
import { sampleTemplates } from '@/data/sampleTemplates'

/** 模板元信息（列表展示用） */
export interface TemplateMeta {
  id: string
  name: string
  description?: string
}

let _templates: FormTemplate[] = sampleTemplates()
let _initialized = false

function ensureInit() {
  if (!_initialized) {
    _templates = sampleTemplates()
    _initialized = true
  }
}

export const templateApi = {
  list(): TemplateMeta[] {
    ensureInit()
    return _templates.map(t => ({
      id: t.id,
      name: t.name ?? '未命名模板',
      description: t.description
    }))
  },

  get(id: string): FormTemplate | null {
    ensureInit()
    return _templates.find(t => t.id === id) || null
  },

  create(): FormTemplate {
    ensureInit()
    const template: FormTemplate = {
      id: uid('tmpl_'),
      name: '未命名模板',
      description: '',
      components: []
    }
    _templates.push(template)
    return template
  },

  update(template: FormTemplate): FormTemplate {
    ensureInit()
    const idx = _templates.findIndex(t => t.id === template.id)
    if (idx >= 0) {
      _templates[idx] = template
    } else {
      _templates.push(template)
    }
    return template
  },

  remove(id: string) {
    ensureInit()
    _templates = _templates.filter(t => t.id !== id)
  },

  duplicate(id: string): FormTemplate | null {
    ensureInit()
    const src = this.get(id)
    if (!src) return null
    const copy: FormTemplate = JSON.parse(JSON.stringify(src))
    copy.id = uid('tmpl_')
    copy.name = (src.name ?? '未命名') + ' - 副本'
    _templates.push(copy)
    return copy
  },

  /** 导出 JSON（用于下载 / 给后端） */
  export(id: string): void {
    const t = this.get(id)
    if (!t) return
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.name ?? 'template'}-${t.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  /** 直接从内存对象导出（绕过模板存储） */
  exportObject(t: FormTemplate): void {
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.name ?? 'template'}-${t.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  import(file: File): Promise<FormTemplate> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as FormTemplate
          data.id = uid('tmpl_')
          _templates.push(data)
          resolve(data)
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  },

  /** 重置为示例数据 */
  reset() {
    _templates = sampleTemplates()
    _initialized = true
  }
}

// helper type aliases（保留向后兼容）
export type { ComponentDef, RuleDef }
