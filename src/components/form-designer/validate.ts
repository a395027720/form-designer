import type { ComponentDef, FormTemplate, BasicComponentType } from './types'

const VALID_TYPES: ReadonlyArray<BasicComponentType> = [
  'Input', 'Textarea', 'InputNumber', 'Select',
  'RadioGroup', 'CheckboxGroup', 'DatePicker',
  'TimePicker', 'Switch', 'DisplayText'
]

export function isValidComponentDef(x: unknown): x is ComponentDef {
  if (!x || typeof x !== 'object') return false
  const d = x as Record<string, any>
  if (typeof d.id !== 'string' || d.id === '') return false
  if (typeof d.type !== 'string' || !VALID_TYPES.includes(d.type as BasicComponentType)) return false
  if (typeof d.field !== 'string' || d.field === '') return false
  if (typeof d.label !== 'string' || d.label === '') return false
  return true
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

export function validateTemplate(x: unknown): ValidationResult {
  const errors: string[] = []

  if (!x || typeof x !== 'object') {
    return { ok: false, errors: ['template is not an object'] }
  }
  const t = x as Record<string, any>

  if (typeof t.id !== 'string' || t.id === '') {
    errors.push('template.id is required')
  }

  if (!Array.isArray(t.components)) {
    errors.push('template.components must be an array')
    return { ok: false, errors }
  }

  t.components.forEach((c: unknown, i: number) => {
    if (!isValidComponentDef(c)) {
      errors.push(`components[${i}] is invalid`)
    }
  })

  return { ok: errors.length === 0, errors }
}
