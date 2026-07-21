import type { FormTemplate, TemplateMeta } from '@/types/template'
import { uid } from '@/utils/uid'
import { sampleTemplates } from '@/data/sampleTemplates'

const STORAGE_KEY = 'check-report-templates'

/**
 * 从 localStorage 加载所有模板；首次访问注入示例模板
 */
function loadAll(): FormTemplate[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as FormTemplate[]
    } catch {
      console.warn('[templateApi] 解析失败，重置')
    }
  }
  const seeds = sampleTemplates()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds))
  return seeds
}

function saveAll(list: FormTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export const templateApi = {
  list(): TemplateMeta[] {
    return loadAll().map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      componentCount: t.components.length,
      createdAt: t.createdAt || '',
      updatedAt: t.updatedAt || ''
    }))
  },

  get(id: string): FormTemplate | null {
    return loadAll().find(t => t.id === id) || null
  },

  create(): FormTemplate {
    const now = new Date().toISOString()
    const template: FormTemplate = {
      version: '1.0.0',
      id: uid('tmpl_'),
      name: '未命名模板',
      category: '未分类',
      description: '',
      layout: { type: 'form' },
      components: [],
      createdAt: now,
      updatedAt: now
    }
    const all = loadAll()
    all.push(template)
    saveAll(all)
    return template
  },

  update(template: FormTemplate): FormTemplate {
    const all = loadAll()
    const idx = all.findIndex(t => t.id === template.id)
    template.updatedAt = new Date().toISOString()
    if (idx >= 0) {
      all[idx] = template
    } else {
      all.push(template)
    }
    saveAll(all)
    return template
  },

  remove(id: string) {
    const all = loadAll().filter(t => t.id !== id)
    saveAll(all)
  },

  duplicate(id: string): FormTemplate | null {
    const src = this.get(id)
    if (!src) return null
    const now = new Date().toISOString()
    const copy: FormTemplate = JSON.parse(JSON.stringify(src))
    copy.id = uid('tmpl_')
    copy.name = src.name + ' - 副本'
    copy.createdAt = now
    copy.updatedAt = now
    const all = loadAll()
    all.push(copy)
    saveAll(all)
    return copy
  },

  export(id: string): void {
    const t = this.get(id)
    if (!t) return
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.name}-${t.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  /** 直接从内存中的模板对象导出（绕过 localStorage，确保包含未保存的修改） */
  exportObject(t: FormTemplate): void {
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.name}-${t.id}.json`
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
          data.updatedAt = new Date().toISOString()
          const all = loadAll()
          all.push(data)
          saveAll(all)
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
    saveAll(sampleTemplates())
  }
}