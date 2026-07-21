# SDK 重构 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 `src/sdk/` 下实现可发布到 npm 的 Vue 3 SDK 主体：`<FormDesigner>`（3 mode）+ `<FormRenderer>` + 公开类型 + 校验 + 构建配置。

**架构：** SDK 入口在 `src/sdk/index.ts`，三个 mode 在同一个 `FormDesigner.vue` 内通过条件渲染分发。内部用自实现 UI 组件（计划 A 产出），不依赖 antd。RuleEngine 沿用现有逻辑。

**技术栈：** Vue 3.5 + TypeScript 5.6 + Vitest + @vue/test-utils + Vite (lib mode)

**依赖关系：** 此计划依赖计划 A（自实现 UI 组件库）。是计划 C（dev demo 重构）的前置。

---

## 文件结构

要创建的文件：

| 路径 | 职责 |
|---|---|
| `src/sdk/index.ts` | 主入口，导出所有公开 API |
| `src/sdk/types.ts` | 公开 TypeScript 类型（ComponentDef、FormTemplate、RuleDef、RuleAction、Props、Emits） |
| `src/sdk/components/FormDesigner.vue` | 设计器（3 mode） |
| `src/sdk/components/FormRenderer.vue` | 渲染器（无 mode） |
| `src/sdk/internal/basicComponents.ts` | 10 种基础组件的元数据（label、type、所属分类） |
| `src/sdk/internal/canvas/FieldPreview.vue` | 单字段预览（field 模式中间区域） |
| `src/sdk/internal/canvas/CanvasItem.vue` | 画布单项（basic / presets 模式中间区域） |
| `src/sdk/internal/property/PropertyPanel.vue` | 属性面板（field 模式右侧） |
| `src/sdk/internal/library/FieldLibrary.vue` | 左侧组件库 - field 模式（10 种 antd 基础） |
| `src/sdk/internal/library/BasicLibrary.vue` | 左侧组件库 - basic 模式（10 种 antd 基础） |
| `src/sdk/internal/library/PresetsLibrary.vue` | 左侧组件库 - presets 模式（外部小项目清单） |
| `src/sdk/internal/rules/index.ts` | 5 种 RuleEditor 的统一导出 |
| `src/sdk/internal/rules/ValidationRuleEditor.vue` | 沿用现有 |
| `src/sdk/internal/rules/ConditionalRuleEditor.vue` | 沿用现有 |
| `src/sdk/internal/rules/CalculationRuleEditor.vue` | 沿用现有 |
| `src/sdk/internal/rules/ComparisonRuleEditor.vue` | 沿用现有 |
| `src/sdk/internal/rules/ThresholdRuleEditor.vue` | 沿用现有 |
| `src/sdk/internal/validate.ts` | 校验函数：`isValidComponentDef`、`validateTemplate` |
| `src/sdk/internal/stores/designerStore.ts` | 内部 store（临时 ID、ref 校验等） |
| `src/sdk/runtime/RuleEngine.ts` | 沿用 `src/components/renderer/engine/RuleEngine.ts` |
| `src/sdk/runtime/ExpressionEvaluator.ts` | 沿用 |
| `src/sdk/runtime/ActionApplier.ts` | 沿用 |
| `src/sdk/__tests__/*.spec.ts` | 单测（validate、store、RuleEngine） |
| `src/sdk/components/__tests__/*.spec.ts` | 组件测（FormDesigner、FormRenderer） |

要移动的文件（从 `src/components/renderer/engine/`）：

| 旧路径 | 新路径 |
|---|---|
| `src/components/renderer/engine/RuleEngine.ts` | `src/sdk/runtime/RuleEngine.ts` |
| `src/components/renderer/engine/ExpressionEvaluator.ts` | `src/sdk/runtime/ExpressionEvaluator.ts` |
| `src/components/renderer/engine/ActionApplier.ts` | `src/sdk/runtime/ActionApplier.ts` |

要移动的文件（从 `src/components/designer/rules/`）：

| 旧路径 | 新路径 |
|---|---|
| `src/components/designer/rules/RuleList.vue` | 沿用路径（在 `src/sdk/internal/rules/` 下重组） |
| `src/components/designer/rules/RuleWizard.vue` | 同上 |
| `src/components/designer/rules/ExpressionEditor.vue` | 同上 |
| `src/components/designer/rules/ValidationRuleEditor.vue` | `src/sdk/internal/rules/ValidationRuleEditor.vue` |
| `src/components/designer/rules/ConditionalRuleEditor.vue` | `src/sdk/internal/rules/ConditionalRuleEditor.vue` |
| `src/components/designer/rules/CalculationRuleEditor.vue` | `src/sdk/internal/rules/CalculationRuleEditor.vue` |
| `src/components/designer/rules/ComparisonRuleEditor.vue` | `src/sdk/internal/rules/ComparisonRuleEditor.vue` |
| `src/components/designer/rules/ThresholdRuleEditor.vue` | `src/sdk/internal/rules/ThresholdRuleEditor.vue` |

要修改的文件：

| 路径 | 改动 |
|---|---|
| `package.json` | 加 peerDependencies / exports / files / build script |
| `vite.config.ts` | 增加 lib mode 配置 |
| `tsconfig.json` | 加 `paths` 别名支持（如果还没有） |
| `src/components/renderer/engine/*.ts` | 改造：去掉 any，加公开类型 |
| `src/components/designer/rules/*.vue` | 改造：把 a-* 引用替换为自实现 UI 组件 |

---

## 任务 1：公开类型定义

**文件：**
- 创建：`src/sdk/types.ts`
- 创建：`src/sdk/__tests__/types.spec.ts`（类型编译测试，验证导出可用）

- [ ] **步骤 1：写 types.ts**

文件：`src/sdk/types.ts`

```ts
/** antd 基础组件类型 */
export type BasicComponentType =
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

/** 规则类型 */
export type RuleType =
  | 'calculation'
  | 'threshold'
  | 'comparison'
  | 'conditional'
  | 'validation'

export type TriggerType = 'onChange' | 'onBlur' | 'onInit'

/** 规则副作用 */
export type RuleActionType =
  | 'setStyle'
  | 'addClass'
  | 'show'
  | 'hidden'
  | 'setText'
  | 'setRequired'

export interface RuleAction {
  type: RuleActionType
  target: string
  payload?: any
}

/** 规则定义 */
export interface RuleDef {
  id: string
  type: RuleType
  name: string
  enabled: boolean
  trigger: TriggerType
  params: Record<string, any>
}

/** 组件定义（"小项目" = 一个具体字段） */
export interface ComponentDef {
  id: string
  type: BasicComponentType
  field: string
  label: string
  required?: boolean
  columns?: number
  props?: Record<string, any>
  rules?: RuleDef[]
}

/** 模板定义（大项，components[] 纯 inline） */
export interface FormTemplate {
  id: string
  version?: string
  components: ComponentDef[]
  metadata?: Record<string, any>
}

/** FormDesigner mode */
export type FormDesignerMode = 'field' | 'basic' | 'presets'

/** FormDesigner props */
export interface FormDesignerProps {
  mode: FormDesignerMode
  component: ComponentDef | FormTemplate
  components?: ComponentDef[]
  readonly?: boolean
}

/** FormDesigner emits */
export interface FormDesignerEmits {
  (e: 'update:component', value: ComponentDef | FormTemplate): void
  (e: 'save', value: ComponentDef | FormTemplate): void
  (e: 'cancel'): void
}

/** FormRenderer props */
export interface FormRendererProps {
  component: FormTemplate
  formData?: Record<string, any>
}

/** FormRenderer emits */
export interface FormRendererEmits {
  (e: 'update:formData', data: Record<string, any>): void
  (e: 'field-change', payload: { field: string, value: any }): void
}
```

- [ ] **步骤 2：写编译测试**

文件：`src/sdk/__tests__/types.spec.ts`

```ts
import { describe, it, expectTypeOf } from 'vitest'
import type {
  ComponentDef,
  FormTemplate,
  BasicComponentType,
  FormDesignerMode
} from '../types'

describe('types', () => {
  it('BasicComponentType accepts all 10 values', () => {
    expectTypeOf<'Input'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'Textarea'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'InputNumber'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'Select'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'RadioGroup'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'CheckboxGroup'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'DatePicker'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'TimePicker'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'Switch'>().toMatchTypeOf<BasicComponentType>()
    expectTypeOf<'DisplayText'>().toMatchTypeOf<BasicComponentType>()
  })

  it('FormDesignerMode accepts all 3 values', () => {
    expectTypeOf<'field'>().toMatchTypeOf<FormDesignerMode>()
    expectTypeOf<'basic'>().toMatchTypeOf<FormDesignerMode>()
    expectTypeOf<'presets'>().toMatchTypeOf<FormDesignerMode>()
  })

  it('ComponentDef has required fields', () => {
    const def: ComponentDef = {
      id: '1',
      type: 'Input',
      field: 'name',
      label: '姓名'
    }
    expect(def.id).toBe('1')
  })

  it('FormTemplate requires components array', () => {
    const tpl: FormTemplate = {
      id: 't1',
      components: []
    }
    expect(tpl.components).toEqual([])
  })
})
```

- [ ] **步骤 3：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- types
```

预期：4 个 test 通过。

- [ ] **步骤 4：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/types.ts src/sdk/__tests__/types.spec.ts
git commit -m "feat(sdk): add public type definitions"
```

---

## 任务 2：校验函数

**文件：**
- 创建：`src/sdk/internal/validate.ts`
- 创建：`src/sdk/__tests__/validate.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/__tests__/validate.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { isValidComponentDef, validateTemplate } from '../internal/validate'

describe('isValidComponentDef', () => {
  it('returns true for valid ComponentDef', () => {
    expect(isValidComponentDef({
      id: '1', type: 'Input', field: 'name', label: '姓名'
    })).toBe(true)
  })

  it('returns false when id is missing', () => {
    expect(isValidComponentDef({
      type: 'Input', field: 'name', label: '姓名'
    })).toBe(false)
  })

  it('returns false when type is unknown', () => {
    expect(isValidComponentDef({
      id: '1', type: 'Foo', field: 'name', label: '姓名'
    })).toBe(false)
  })

  it('returns false when field is empty', () => {
    expect(isValidComponentDef({
      id: '1', type: 'Input', field: '', label: '姓名'
    })).toBe(false)
  })

  it('returns false when label is empty', () => {
    expect(isValidComponentDef({
      id: '1', type: 'Input', field: 'name', label: ''
    })).toBe(false)
  })
})

describe('validateTemplate', () => {
  it('returns ok=true for valid template', () => {
    const r = validateTemplate({
      id: 't1', components: [
        { id: '1', type: 'Input', field: 'name', label: '姓名' }
      ]
    })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('returns ok=false when components missing', () => {
    const r = validateTemplate({ id: 't1' })
    expect(r.ok).toBe(false)
    expect(r.errors.length).toBeGreaterThan(0)
  })

  it('reports invalid component errors with index', () => {
    const r = validateTemplate({
      id: 't1', components: [
        { id: '1', type: 'Input', field: 'name', label: '姓名' },
        { id: '2', type: 'Bad', field: 'x', label: 'X' }
      ]
    })
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => e.includes('index 1'))).toBe(true)
  })

  it('returns ok=false for non-object input', () => {
    expect(validateTemplate(null).ok).toBe(false)
    expect(validateTemplate('string').ok).toBe(false)
    expect(validateTemplate(42).ok).toBe(false)
  })

  it('returns ok=false when components is not array', () => {
    const r = validateTemplate({ id: 't1', components: 'oops' })
    expect(r.ok).toBe(false)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- validate
```

预期：FAIL — validate.ts 不存在。

- [ ] **步骤 3：实现 validate.ts**

文件：`src/sdk/internal/validate.ts`

```ts
import type { ComponentDef, FormTemplate, BasicComponentType } from '../types'

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
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- validate
```

预期：10 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/validate.ts src/sdk/__tests__/validate.spec.ts
git commit -m "feat(sdk): add validation functions with tests"
```

---

## 任务 3：基础组件元数据

**文件：**
- 创建：`src/sdk/internal/basicComponents.ts`
- 创建：`src/sdk/__tests__/basicComponents.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/__tests__/basicComponents.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { BASIC_COMPONENTS, getBasicComponentByType } from '../internal/basicComponents'

describe('BASIC_COMPONENTS', () => {
  it('has exactly 10 entries', () => {
    expect(BASIC_COMPONENTS.length).toBe(10)
  })

  it('each entry has type, label, defaultProps', () => {
    BASIC_COMPONENTS.forEach(c => {
      expect(typeof c.type).toBe('string')
      expect(typeof c.label).toBe('string')
      expect(c.defaultProps).toBeDefined()
    })
  })
})

describe('getBasicComponentByType', () => {
  it('returns metadata for known type', () => {
    const m = getBasicComponentByType('Input')
    expect(m?.type).toBe('Input')
    expect(m?.label).toBe('输入框')
  })

  it('returns undefined for unknown type', () => {
    expect(getBasicComponentByType('Foo')).toBeUndefined()
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- basicComponents
```

预期：FAIL — basicComponents.ts 不存在。

- [ ] **步骤 3：实现 basicComponents.ts**

文件：`src/sdk/internal/basicComponents.ts`

```ts
import type { BasicComponentType, ComponentDef } from '../types'

export interface BasicComponentMeta {
  type: BasicComponentType
  label: string
  defaultProps: Partial<ComponentDef>
}

export const BASIC_COMPONENTS: BasicComponentMeta[] = [
  {
    type: 'Input',
    label: '输入框',
    defaultProps: { type: 'Input', field: '', label: '输入框', required: false, columns: 24 }
  },
  {
    type: 'Textarea',
    label: '多行文本',
    defaultProps: { type: 'Textarea', field: '', label: '多行文本', required: false, columns: 24 }
  },
  {
    type: 'InputNumber',
    label: '数字输入',
    defaultProps: { type: 'InputNumber', field: '', label: '数字输入', required: false, columns: 24 }
  },
  {
    type: 'Select',
    label: '下拉选择',
    defaultProps: { type: 'Select', field: '', label: '下拉选择', required: false, columns: 24, props: { options: [] } }
  },
  {
    type: 'RadioGroup',
    label: '单选组',
    defaultProps: { type: 'RadioGroup', field: '', label: '单选组', required: false, columns: 24, props: { options: [] } }
  },
  {
    type: 'CheckboxGroup',
    label: '多选组',
    defaultProps: { type: 'CheckboxGroup', field: '', label: '多选组', required: false, columns: 24, props: { options: [] } }
  },
  {
    type: 'DatePicker',
    label: '日期选择',
    defaultProps: { type: 'DatePicker', field: '', label: '日期选择', required: false, columns: 24 }
  },
  {
    type: 'TimePicker',
    label: '时间选择',
    defaultProps: { type: 'TimePicker', field: '', label: '时间选择', required: false, columns: 24 }
  },
  {
    type: 'Switch',
    label: '开关',
    defaultProps: { type: 'Switch', field: '', label: '开关', required: false, columns: 24 }
  },
  {
    type: 'DisplayText',
    label: '展示文本',
    defaultProps: { type: 'DisplayText', field: '', label: '展示文本', columns: 24 }
  }
]

export function getBasicComponentByType(type: string): BasicComponentMeta | undefined {
  return BASIC_COMPONENTS.find(c => c.type === type)
}
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- basicComponents
```

预期：3 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/basicComponents.ts src/sdk/__tests__/basicComponents.spec.ts
git commit -m "feat(sdk): add basic components metadata"
```

---

## 任务 4：内部 store（含临时 ID 机制）

**文件：**
- 创建：`src/sdk/internal/stores/designerStore.ts`
- 创建：`src/sdk/__tests__/designerStore.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/__tests__/designerStore.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDesignerStore } from '../internal/stores/designerStore'

describe('designerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('generates tempId with prefix', () => {
    const store = useDesignerStore()
    const id = store.generateTempId()
    expect(id).toMatch(/^temp-/)
  })

  it('generateTempId returns unique values', () => {
    const store = useDesignerStore()
    const a = store.generateTempId()
    const b = store.generateTempId()
    expect(a).not.toBe(b)
  })

  it('ensureTempIds adds temp ids to inline components without id', () => {
    const store = useDesignerStore()
    const comps = [
      { type: 'Input', field: 'a', label: 'A' },  // no id
      { type: 'Input', field: 'b', label: 'B' }   // no id
    ]
    const result = store.ensureTempIds(comps as any)
    expect(result[0].id).toMatch(/^temp-/)
    expect(result[1].id).toMatch(/^temp-/)
  })

  it('ensureTempIds preserves existing ids', () => {
    const store = useDesignerStore()
    const comps = [
      { id: 'real-id', type: 'Input', field: 'a', label: 'A' }
    ]
    const result = store.ensureTempIds(comps as any)
    expect(result[0].id).toBe('real-id')
  })

  it('ensureTempIds mutates input in place', () => {
    const store = useDesignerStore()
    const comps: any[] = [{ type: 'Input', field: 'a', label: 'A' }]
    const result = store.ensureTempIds(comps)
    expect(result[0]).toBe(comps[0])  // same reference
    expect(comps[0].id).toMatch(/^temp-/)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- designerStore
```

预期：FAIL — designerStore.ts 不存在。

- [ ] **步骤 3：实现 designerStore.ts**

文件：`src/sdk/internal/stores/designerStore.ts`

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentDef } from '../../types'
import { uid } from '@/utils/uid'

export const useDesignerStore = defineStore('sdk-designer', () => {
  const tempIdCounter = ref(0)

  function generateTempId(): string {
    tempIdCounter.value += 1
    return `temp-${Date.now()}-${tempIdCounter.value}`
  }

  /**
   * 给 inline 组件补临时 id（仅作 v-for key，不暴露给 consumer）
   * 已有 id 的不动；in place 修改
   */
  function ensureTempIds<T extends { id?: string }>(components: T[]): T[] {
    components.forEach(c => {
      if (!c.id) {
        c.id = generateTempId()
      }
    })
    return components
  }

  return {
    tempIdCounter,
    generateTempId,
    ensureTempIds
  }
})
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- designerStore
```

预期：5 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/stores/designerStore.ts src/sdk/__tests__/designerStore.spec.ts
git commit -m "feat(sdk): add designer store with temp id mechanism"
```

---

## 任务 5：迁移规则引擎

**文件：**
- 移动：`src/components/renderer/engine/RuleEngine.ts` → `src/sdk/runtime/RuleEngine.ts`
- 移动：`src/components/renderer/engine/ExpressionEvaluator.ts` → `src/sdk/runtime/ExpressionEvaluator.ts`
- 移动：`src/components/renderer/engine/ActionApplier.ts` → `src/sdk/runtime/ActionApplier.ts`
- 修改：所有 import 路径

- [ ] **步骤 1：移动文件**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
mkdir -p src/sdk/runtime
git mv src/components/renderer/engine/RuleEngine.ts src/sdk/runtime/RuleEngine.ts
git mv src/components/renderer/engine/ExpressionEvaluator.ts src/sdk/runtime/ExpressionEvaluator.ts
git mv src/components/renderer/engine/ActionApplier.ts src/sdk/runtime/ActionApplier.ts
rmdir src/components/renderer/engine 2>/dev/null || true
```

- [ ] **步骤 2：查找所有引用并更新**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
grep -rln "components/renderer/engine" src/
```

对每个引用文件，更新 import 路径：把 `'@/components/renderer/engine/RuleEngine'` 改成 `'@/sdk/runtime/RuleEngine'`，等等。

- [ ] **步骤 3：跑 type check 确认没破**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npx vue-tsc --noEmit
```

预期：无错误。

- [ ] **步骤 4：跑全部测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test
```

预期：所有测试通过（计划 A + 任务 1-4）。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add -A
git commit -m "refactor(sdk): move rule engine to src/sdk/runtime"
```

---

## 任务 6：FieldPreview 组件

**文件：**
- 创建：`src/sdk/internal/canvas/FieldPreview.vue`
- 创建：`src/sdk/internal/canvas/__tests__/FieldPreview.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/canvas/__tests__/FieldPreview.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldPreview from '../FieldPreview.vue'
import type { ComponentDef } from '../../../types'

describe('FieldPreview', () => {
  it('renders Input component when type is Input', () => {
    const def: ComponentDef = { id: '1', type: 'Input', field: 'name', label: '姓名' }
    const wrapper = mount(FieldPreview, { props: { component: def } })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('renders label', () => {
    const def: ComponentDef = { id: '1', type: 'Input', field: 'name', label: '姓名' }
    const wrapper = mount(FieldPreview, { props: { component: def } })
    expect(wrapper.text()).toContain('姓名')
  })

  it('shows required asterisk when required=true', () => {
    const def: ComponentDef = { id: '1', type: 'Input', field: 'name', label: '姓名', required: true }
    const wrapper = mount(FieldPreview, { props: { component: def } })
    expect(wrapper.text()).toContain('*')
  })

  it('renders placeholder from props', () => {
    const def: ComponentDef = {
      id: '1', type: 'Input', field: 'name', label: '姓名',
      props: { placeholder: '请输入姓名' }
    }
    const wrapper = mount(FieldPreview, { props: { component: def } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入姓名')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldPreview
```

预期：FAIL — FieldPreview.vue 不存在。

- [ ] **步骤 3：实现 FieldPreview.vue**

文件：`src/sdk/internal/canvas/FieldPreview.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentDef } from '../../types'
import { Input, Textarea, InputNumber, Select, RadioGroup, CheckboxGroup, DatePicker, TimePicker, Switch, DisplayText } from '../ui'

interface Props {
  component: ComponentDef
  modelValue?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const componentType = computed(() => props.component.type)

// 为不同类型准备 props
const inputProps = computed(() => ({
  modelValue: props.modelValue,
  placeholder: props.component.props?.placeholder,
  maxLength: props.component.props?.maxLength,
  disabled: props.component.props?.disabled
}))

const selectProps = computed(() => ({
  modelValue: props.modelValue,
  options: props.component.props?.options ?? [],
  placeholder: props.component.props?.placeholder,
  disabled: props.component.props?.disabled
}))

function onUpdate(value: any) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="fd-field-preview">
    <label class="fd-field-label">
      {{ component.label }}
      <span v-if="component.required" class="fd-required">*</span>
    </label>
    <div class="fd-field-control">
      <Input
        v-if="componentType === 'Input'"
        v-bind="inputProps"
        @update:modelValue="onUpdate"
      />
      <Textarea
        v-else-if="componentType === 'Textarea'"
        v-bind="inputProps"
        :rows="component.props?.rows"
        @update:modelValue="onUpdate"
      />
      <InputNumber
        v-else-if="componentType === 'InputNumber'"
        v-bind="inputProps"
        :min="component.props?.min"
        :max="component.props?.max"
        @update:modelValue="onUpdate"
      />
      <Select
        v-else-if="componentType === 'Select'"
        v-bind="selectProps"
        @update:modelValue="onUpdate"
      />
      <RadioGroup
        v-else-if="componentType === 'RadioGroup'"
        v-bind="selectProps"
        @update:modelValue="onUpdate"
      />
      <CheckboxGroup
        v-else-if="componentType === 'CheckboxGroup'"
        v-bind="selectProps"
        @update:modelValue="onUpdate"
      />
      <DatePicker
        v-else-if="componentType === 'DatePicker'"
        v-bind="inputProps"
        @update:modelValue="onUpdate"
      />
      <TimePicker
        v-else-if="componentType === 'TimePicker'"
        v-bind="inputProps"
        @update:modelValue="onUpdate"
      />
      <Switch
        v-else-if="componentType === 'Switch'"
        :modelValue="modelValue"
        @update:modelValue="onUpdate"
      />
      <DisplayText
        v-else-if="componentType === 'DisplayText'"
        :modelValue="modelValue ?? component.props?.text ?? ''"
      />
      <div v-else class="fd-unknown-type">未知类型: {{ componentType }}</div>
    </div>
  </div>
</template>

<style scoped>
.fd-field-preview {
  padding: 12px 0;
}
.fd-field-label {
  display: block;
  margin-bottom: 6px;
  color: var(--color-text);
  font-size: var(--font-size);
}
.fd-required {
  color: var(--color-error);
  margin-left: 4px;
}
.fd-field-control {
  width: 100%;
}
.fd-unknown-type {
  color: var(--color-text-disabled);
  padding: 8px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldPreview
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/canvas/FieldPreview.vue src/sdk/internal/canvas/__tests__/FieldPreview.spec.ts
git commit -m "feat(sdk): add FieldPreview component for single field rendering"
```

---

## 任务 7：PropertyPanel 组件

**文件：**
- 创建：`src/sdk/internal/property/PropertyPanel.vue`
- 创建：`src/sdk/internal/property/__tests__/PropertyPanel.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/property/__tests__/PropertyPanel.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PropertyPanel from '../PropertyPanel.vue'
import type { ComponentDef } from '../../../types'

describe('PropertyPanel', () => {
  const def: ComponentDef = { id: '1', type: 'Input', field: 'name', label: '姓名' }

  it('renders label input', () => {
    const wrapper = mount(PropertyPanel, { props: { component: def } })
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('emits update:component when label changes', async () => {
    const wrapper = mount(PropertyPanel, { props: { component: def } })
    const labelInput = wrapper.findAll('input')[0]  // 第一个 input 是 label
    await labelInput.setValue('患者姓名')
    const events = wrapper.emitted('update:component')
    expect(events).toBeTruthy()
    expect((events![0][0] as ComponentDef).label).toBe('患者姓名')
  })

  it('emits update:component when field changes', async () => {
    const wrapper = mount(PropertyPanel, { props: { component: def } })
    const inputs = wrapper.findAll('input')
    await inputs[1].setValue('patientName')
    const events = wrapper.emitted('update:component')
    expect((events![0][0] as ComponentDef).field).toBe('patientName')
  })

  it('renders required checkbox', () => {
    const wrapper = mount(PropertyPanel, { props: { component: def } })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- PropertyPanel
```

预期：FAIL — PropertyPanel.vue 不存在。

- [ ] **步骤 3：实现 PropertyPanel.vue**

文件：`src/sdk/internal/property/PropertyPanel.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentDef } from '../../types'
import { Input, InputNumber, Switch } from '../ui'

interface Props {
  component: ComponentDef
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:component', value: ComponentDef): void
}>()

function update(patch: Partial<ComponentDef>) {
  emit('update:component', { ...props.component, ...patch })
}

function onLabelChange(v: string) { update({ label: v }) }
function onFieldChange(v: string) { update({ field: v }) }
function onRequiredChange(v: boolean) { update({ required: v }) }
function onColumnsChange(v: number | null) { update({ columns: v ?? undefined }) }
</script>

<template>
  <div class="fd-property-panel">
    <h3 class="fd-section-title">属性</h3>

    <div class="fd-field">
      <label>标签 (label)</label>
      <Input :modelValue="component.label" @update:modelValue="onLabelChange" />
    </div>

    <div class="fd-field">
      <label>字段名 (field)</label>
      <Input :modelValue="component.field" @update:modelValue="onFieldChange" />
    </div>

    <div class="fd-field">
      <label>必填</label>
      <Switch :modelValue="component.required ?? false" @update:modelValue="onRequiredChange" />
    </div>

    <div class="fd-field">
      <label>列宽 (24 栅格)</label>
      <InputNumber
        :modelValue="component.columns ?? 24"
        :min="1"
        :max="24"
        @update:modelValue="onColumnsChange"
      />
    </div>
  </div>
</template>

<style scoped>
.fd-property-panel {
  padding: 16px;
}
.fd-section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.fd-field {
  margin-bottom: 12px;
}
.fd-field label {
  display: block;
  margin-bottom: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- PropertyPanel
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/property/PropertyPanel.vue src/sdk/internal/property/__tests__/PropertyPanel.spec.ts
git commit -m "feat(sdk): add PropertyPanel for editing ComponentDef attributes"
```

---

## 任务 8：FieldLibrary / BasicLibrary / PresetsLibrary

**文件：**
- 创建：`src/sdk/internal/library/FieldLibrary.vue`
- 创建：`src/sdk/internal/library/BasicLibrary.vue`
- 创建：`src/sdk/internal/library/PresetsLibrary.vue`
- 创建：`src/sdk/internal/library/__tests__/FieldLibrary.spec.ts`
- 创建：`src/sdk/internal/library/__tests__/PresetsLibrary.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/library/__tests__/FieldLibrary.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldLibrary from '../FieldLibrary.vue'

describe('FieldLibrary', () => {
  it('renders 10 basic components', () => {
    const wrapper = mount(FieldLibrary, {
      props: { modelValue: 'Input' }
    })
    const items = wrapper.findAll('.fd-lib-item')
    expect(items.length).toBe(10)
  })

  it('emits update:modelValue when item clicked', async () => {
    const wrapper = mount(FieldLibrary, {
      props: { modelValue: 'Input' }
    })
    const items = wrapper.findAll('.fd-lib-item')
    await items[2].trigger('click')  // 第三个是 InputNumber
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['InputNumber'])
  })

  it('highlights currently selected type', () => {
    const wrapper = mount(FieldLibrary, {
      props: { modelValue: 'Select' }
    })
    const items = wrapper.findAll('.fd-lib-item')
    const selected = items.find(i => i.classes().includes('fd-lib-item-selected'))
    expect(selected?.text()).toContain('下拉选择')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldLibrary
```

预期：FAIL。

- [ ] **步骤 3：实现 FieldLibrary.vue**

文件：`src/sdk/internal/library/FieldLibrary.vue`

```vue
<script setup lang="ts">
import { BASIC_COMPONENTS } from '../basicComponents'
import type { BasicComponentType } from '../../types'

interface Props {
  modelValue: BasicComponentType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: BasicComponentType): void
}>()

function select(type: BasicComponentType) {
  emit('update:modelValue', type)
}
</script>

<template>
  <div class="fd-library">
    <h3 class="fd-lib-title">基础组件</h3>
    <div class="fd-lib-list">
      <div
        v-for="c in BASIC_COMPONENTS"
        :key="c.type"
        class="fd-lib-item"
        :class="{ 'fd-lib-item-selected': modelValue === c.type }"
        @click="select(c.type)"
      >
        {{ c.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.fd-library {
  border-right: 1px solid var(--color-border);
  padding: 12px;
  background: var(--color-bg);
}
.fd-lib-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.fd-lib-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fd-lib-item {
  padding: 8px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--color-text);
  font-size: var(--font-size);
  transition: background 0.2s;
}
.fd-lib-item:hover {
  background: var(--color-bg-hover);
}
.fd-lib-item-selected {
  background: rgba(24, 144, 255, 0.1);
  color: var(--color-primary);
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldLibrary
```

预期：3 个 test 通过。

- [ ] **步骤 5：实现 BasicLibrary.vue**

文件：`src/sdk/internal/library/BasicLibrary.vue`

```vue
<script setup lang="ts">
import { BASIC_COMPONENTS } from '../basicComponents'
import type { ComponentDef } from '../../types'

const emit = defineEmits<{
  (e: 'add', component: ComponentDef): void
}>()

function onDragStart(e: DragEvent, type: string) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', type)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

function onClick(meta: typeof BASIC_COMPONENTS[number]) {
  emit('add', {
    id: '',
    type: meta.type,
    field: '',
    label: meta.label,
    ...meta.defaultProps
  } as ComponentDef)
}
</script>

<template>
  <div class="fd-library">
    <h3 class="fd-lib-title">基础组件</h3>
    <div class="fd-lib-list">
      <div
        v-for="c in BASIC_COMPONENTS"
        :key="c.type"
        class="fd-lib-item"
        draggable="true"
        @dragstart="(e) => onDragStart(e, c.type)"
        @click="onClick(c)"
      >
        {{ c.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.fd-library {
  border-right: 1px solid var(--color-border);
  padding: 12px;
  background: var(--color-bg);
}
.fd-lib-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.fd-lib-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fd-lib-item {
  padding: 8px 12px;
  border-radius: var(--radius);
  cursor: grab;
  color: var(--color-text);
  font-size: var(--font-size);
  transition: background 0.2s;
}
.fd-lib-item:hover {
  background: var(--color-bg-hover);
}
.fd-lib-item:active {
  cursor: grabbing;
}
</style>
```

- [ ] **步骤 6：写 PresetsLibrary 测试**

文件：`src/sdk/internal/library/__tests__/PresetsLibrary.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PresetsLibrary from '../PresetsLibrary.vue'
import type { ComponentDef } from '../../../types'

const presets: ComponentDef[] = [
  { id: 'tbil', type: 'InputNumber', field: 'tbil', label: '总胆红素' },
  { id: 'alt', type: 'InputNumber', field: 'alt', label: '谷丙转氨酶' }
]

describe('PresetsLibrary', () => {
  it('renders all preset items', () => {
    const wrapper = mount(PresetsLibrary, { props: { presets } })
    const items = wrapper.findAll('.fd-lib-item')
    expect(items.length).toBe(2)
  })

  it('emits add with deep copy on click', async () => {
    const wrapper = mount(PresetsLibrary, { props: { presets } })
    await wrapper.findAll('.fd-lib-item')[0].trigger('click')
    const added = wrapper.emitted('add')?.[0]?.[0] as ComponentDef
    expect(added.label).toBe('总胆红素')
    expect(added.id).not.toBe('tbil')  // 应该是新 id
  })

  it('hides when visible is false', () => {
    const wrapper = mount(PresetsLibrary, {
      props: { presets, visible: false }
    })
    expect(wrapper.find('.fd-library').exists()).toBe(false)
  })
})
```

- [ ] **步骤 7：实现 PresetsLibrary.vue**

文件：`src/sdk/internal/library/PresetsLibrary.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentDef } from '../../types'
import { uid } from '@/utils/uid'

interface Props {
  presets: ComponentDef[]
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), { visible: true })
const emit = defineEmits<{
  (e: 'add', component: ComponentDef): void
}>()

function onAdd(original: ComponentDef) {
  // 深拷贝 + 新 id
  const copy: ComponentDef = {
    ...JSON.parse(JSON.stringify(original)),
    id: uid()
  }
  emit('add', copy)
}

function onDragStart(e: DragEvent, original: ComponentDef) {
  if (e.dataTransfer) {
    const copy = {
      ...JSON.parse(JSON.stringify(original)),
      id: uid()
    }
    e.dataTransfer.setData('application/json', JSON.stringify(copy))
    e.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<template>
  <div v-if="visible" class="fd-library">
    <h3 class="fd-lib-title">小项目</h3>
    <div class="fd-lib-list">
      <div
        v-for="c in presets"
        :key="c.id"
        class="fd-lib-item"
        draggable="true"
        @click="onAdd(c)"
        @dragstart="(e) => onDragStart(e, c)"
      >
        {{ c.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.fd-library {
  border-right: 1px solid var(--color-border);
  padding: 12px;
  background: var(--color-bg);
}
.fd-lib-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.fd-lib-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fd-lib-item {
  padding: 8px 12px;
  border-radius: var(--radius);
  cursor: grab;
  color: var(--color-text);
  font-size: var(--font-size);
  transition: background 0.2s;
}
.fd-lib-item:hover {
  background: var(--color-bg-hover);
}
</style>
```

- [ ] **步骤 8：跑 PresetsLibrary 测试**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- PresetsLibrary
```

预期：3 个 test 通过。

- [ ] **步骤 9：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/library/
git commit -m "feat(sdk): add 3 library variants for field/basic/presets modes"
```

---

## 任务 9：CanvasItem 组件

**文件：**
- 创建：`src/sdk/internal/canvas/CanvasItem.vue`
- 创建：`src/sdk/internal/canvas/__tests__/CanvasItem.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/canvas/__tests__/CanvasItem.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CanvasItem from '../CanvasItem.vue'
import type { ComponentDef } from '../../../types'

describe('CanvasItem', () => {
  const def: ComponentDef = { id: '1', type: 'Input', field: 'name', label: '姓名' }

  it('renders field label', () => {
    const wrapper = mount(CanvasItem, { props: { component: def } })
    expect(wrapper.text()).toContain('姓名')
  })

  it('emits remove when × clicked', async () => {
    const wrapper = mount(CanvasItem, { props: { component: def } })
    await wrapper.find('.fd-canvas-remove').trigger('click')
    expect(wrapper.emitted('remove')?.[0]).toEqual(['1'])
  })

  it('emits select when clicked', async () => {
    const wrapper = mount(CanvasItem, { props: { component: def } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['1'])
  })

  it('applies readonly style when readonly=true', () => {
    const wrapper = mount(CanvasItem, {
      props: { component: def, readonly: true }
    })
    expect(wrapper.find('.fd-canvas-item').classes()).toContain('fd-canvas-readonly')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- CanvasItem
```

预期：FAIL。

- [ ] **步骤 3：实现 CanvasItem.vue**

文件：`src/sdk/internal/canvas/CanvasItem.vue`

```vue
<script setup lang="ts">
import type { ComponentDef } from '../../types'
import FieldPreview from './FieldPreview.vue'

interface Props {
  component: ComponentDef
  selected?: boolean
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'select', id: string): void
}>()

function onRemove() {
  emit('remove', props.component.id)
}
</script>

<template>
  <div
    class="fd-canvas-item"
    :class="{
      'fd-canvas-selected': selected,
      'fd-canvas-readonly': readonly
    }"
    @click="emit('select', component.id)"
  >
    <div class="fd-canvas-header">
      <span class="fd-canvas-title">{{ component.label }} ({{ component.type }})</span>
      <button v-if="!readonly" class="fd-canvas-remove" @click.stop="onRemove">×</button>
    </div>
    <FieldPreview :component="component" />
  </div>
</template>

<style scoped>
.fd-canvas-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 12px;
  margin-bottom: 8px;
  background: var(--color-bg);
  cursor: pointer;
  transition: border-color 0.2s;
}
.fd-canvas-item:hover {
  border-color: var(--color-primary);
}
.fd-canvas-selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
.fd-canvas-readonly {
  cursor: default;
}
.fd-canvas-readonly:hover {
  border-color: var(--color-border);
}
.fd-canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.fd-canvas-title {
  font-weight: 500;
  color: var(--color-text);
}
.fd-canvas-remove {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
}
.fd-canvas-remove:hover {
  color: var(--color-error);
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- CanvasItem
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/canvas/CanvasItem.vue src/sdk/internal/canvas/__tests__/CanvasItem.spec.ts
git commit -m "feat(sdk): add CanvasItem for multi-component canvas"
```

---

## 任务 10：迁移 rules 编辑器

**文件：**
- 移动：`src/components/designer/rules/*` → `src/sdk/internal/rules/*`
- 修改：去掉 antd 依赖（如有）

- [ ] **步骤 1：移动文件**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
mkdir -p src/sdk/internal/rules
git mv src/components/designer/rules/RuleList.vue src/sdk/internal/rules/RuleList.vue
git mv src/components/designer/rules/RuleWizard.vue src/sdk/internal/rules/RuleWizard.vue
git mv src/components/designer/rules/ExpressionEditor.vue src/sdk/internal/rules/ExpressionEditor.vue
git mv src/components/designer/rules/ValidationRuleEditor.vue src/sdk/internal/rules/ValidationRuleEditor.vue
git mv src/components/designer/rules/ConditionalRuleEditor.vue src/sdk/internal/rules/ConditionalRuleEditor.vue
git mv src/components/designer/rules/CalculationRuleEditor.vue src/sdk/internal/rules/CalculationRuleEditor.vue
git mv src/components/designer/rules/ComparisonRuleEditor.vue src/sdk/internal/rules/ComparisonRuleEditor.vue
git mv src/components/designer/rules/ThresholdRuleEditor.vue src/sdk/internal/rules/ThresholdRuleEditor.vue
```

- [ ] **步骤 2：添加 index.ts 统一导出**

文件：`src/sdk/internal/rules/index.ts`

```ts
export { default as RuleList } from './RuleList.vue'
export { default as RuleWizard } from './RuleWizard.vue'
export { default as ValidationRuleEditor } from './ValidationRuleEditor.vue'
export { default as ConditionalRuleEditor } from './ConditionalRuleEditor.vue'
export { default as CalculationRuleEditor } from './CalculationRuleEditor.vue'
export { default as ComparisonRuleEditor } from './ComparisonRuleEditor.vue'
export { default as ThresholdRuleEditor } from './ThresholdRuleEditor.vue'
```

- [ ] **步骤 3：更新引用 import 路径**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
grep -rln "components/designer/rules" src/ | xargs sed -i '' 's|@/components/designer/rules|@/sdk/internal/rules|g'
```

- [ ] **步骤 4：跑 type check 确认没破**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npx vue-tsc --noEmit
```

预期：可能有些 antd 引用失败，先记下，下个任务处理。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add -A
git commit -m "refactor(sdk): move rule editors to src/sdk/internal/rules"
```

---

## 任务 11：FormDesigner 组件骨架

**文件：**
- 创建：`src/sdk/components/FormDesigner.vue`
- 创建：`src/sdk/components/__tests__/FormDesigner.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/components/__tests__/FormDesigner.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FormDesigner from '../FormDesigner.vue'
import type { ComponentDef, FormTemplate } from '../../types'

describe('FormDesigner', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders field mode when mode=field', () => {
    const def: ComponentDef = { id: '1', type: 'Input', field: 'name', label: '姓名' }
    const wrapper = mount(FormDesigner, {
      props: { mode: 'field', component: def }
    })
    expect(wrapper.find('.fd-mode-field').exists()).toBe(true)
  })

  it('renders basic mode when mode=basic', () => {
    const tpl: FormTemplate = { id: 't1', components: [] }
    const wrapper = mount(FormDesigner, {
      props: { mode: 'basic', component: tpl }
    })
    expect(wrapper.find('.fd-mode-basic').exists()).toBe(true)
  })

  it('renders presets mode when mode=presets', () => {
    const tpl: FormTemplate = { id: 't1', components: [] }
    const wrapper = mount(FormDesigner, {
      props: { mode: 'presets', component: tpl, components: [] }
    })
    expect(wrapper.find('.fd-mode-presets').exists()).toBe(true)
  })

  it('emits save when save button clicked (field mode)', async () => {
    const def: ComponentDef = { id: '1', type: 'Input', field: 'name', label: '姓名' }
    const wrapper = mount(FormDesigner, {
      props: { mode: 'field', component: def }
    })
    await wrapper.find('.fd-save-btn').trigger('click')
    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(def)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FormDesigner
```

预期：FAIL。

- [ ] **步骤 3：实现 FormDesigner.vue（骨架，三个 mode 分发）**

文件：`src/sdk/components/FormDesigner.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { FormDesignerProps, FormDesignerEmits, ComponentDef, FormTemplate } from '../types'
import { useDesignerStore } from '../internal/stores/designerStore'
import FieldLibrary from '../internal/library/FieldLibrary.vue'
import BasicLibrary from '../internal/library/BasicLibrary.vue'
import PresetsLibrary from '../internal/library/PresetsLibrary.vue'
import FieldPreview from '../internal/canvas/FieldPreview.vue'
import CanvasItem from '../internal/canvas/CanvasItem.vue'
import PropertyPanel from '../internal/property/PropertyPanel.vue'

const props = defineProps<FormDesignerProps>()
const emit = defineEmits<FormDesignerEmits>()

const store = useDesignerStore()

const isFieldMode = computed(() => props.mode === 'field')
const isBasicMode = computed(() => props.mode === 'basic')
const isPresetsMode = computed(() => props.mode === 'presets')

// field mode
const fieldDef = computed(() => props.component as ComponentDef)
const selectedType = computed(() => fieldDef.value.type)

function onFieldTypeChange(type: ComponentDef['type']) {
  const updated: ComponentDef = { ...fieldDef.value, type }
  emit('update:component', updated)
}

function onFieldPropertyChange(updated: ComponentDef) {
  emit('update:component', updated)
}

// basic mode
const basicTpl = computed(() => props.component as FormTemplate)
basicTpl.value.components = store.ensureTempIds(basicTpl.value.components)

function onBasicAdd(def: ComponentDef) {
  const newDef = { ...def, id: store.generateTempId() }
  const updated: FormTemplate = {
    ...basicTpl.value,
    components: [...basicTpl.value.components, newDef]
  }
  emit('update:component', updated)
}

function onBasicRemove(id: string) {
  const updated: FormTemplate = {
    ...basicTpl.value,
    components: basicTpl.value.components.filter(c => c.id !== id)
  }
  emit('update:component', updated)
}

// presets mode
const presetsTpl = computed(() => props.component as FormTemplate)
presetsTpl.value.components = store.ensureTempIds(presetsTpl.value.components)
const presetsList = computed(() => props.components ?? [])
const isPresetsVisible = computed(() => presetsTpl.value.components.length === 0)

function onPresetsAdd(def: ComponentDef) {
  if (presetsTpl.value.components.length >= 1) return
  const newDef = { ...def, id: store.generateTempId(), columns: 24 }
  const updated: FormTemplate = {
    ...presetsTpl.value,
    components: [newDef]
  }
  emit('update:component', updated)
}

function onPresetsRemove(id: string) {
  const updated: FormTemplate = {
    ...presetsTpl.value,
    components: presetsTpl.value.components.filter(c => c.id !== id)
  }
  emit('update:component', updated)
}

function onSave() {
  emit('save', props.component)
}

function onCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="fd-designer" :class="`fd-mode-${mode}`">
    <!-- field mode -->
    <div v-if="isFieldMode" class="fd-mode-field fd-designer-layout">
      <FieldLibrary :modelValue="selectedType" @update:modelValue="onFieldTypeChange" />
      <div class="fd-designer-center">
        <FieldPreview :component="fieldDef" />
      </div>
      <PropertyPanel :component="fieldDef" @update:component="onFieldPropertyChange" />
    </div>

    <!-- basic mode -->
    <div v-else-if="isBasicMode" class="fd-mode-basic fd-designer-layout">
      <BasicLibrary @add="onBasicAdd" />
      <div class="fd-designer-center">
        <CanvasItem
          v-for="c in basicTpl.components"
          :key="c.id"
          :component="c"
          @remove="onBasicRemove"
        />
      </div>
      <div class="fd-designer-right" />
    </div>

    <!-- presets mode -->
    <div v-else-if="isPresetsMode" class="fd-mode-presets fd-designer-layout">
      <PresetsLibrary :presets="presetsList" :visible="isPresetsVisible" @add="onPresetsAdd" />
      <div class="fd-designer-center">
        <CanvasItem
          v-for="c in presetsTpl.components"
          :key="c.id"
          :component="c"
          :readonly="true"
          @remove="onPresetsRemove"
        />
      </div>
      <div class="fd-designer-right" />
    </div>

    <div class="fd-designer-toolbar">
      <button class="fd-save-btn" @click="onSave">保存</button>
      <button class="fd-cancel-btn" @click="onCancel">取消</button>
    </div>
  </div>
</template>

<style scoped>
.fd-designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
}
.fd-designer-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}
.fd-designer-center {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.fd-designer-right {
  width: 280px;
  border-left: 1px solid var(--color-border);
}
.fd-designer-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--color-border);
}
.fd-save-btn,
.fd-cancel-btn {
  padding: 4px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  cursor: pointer;
  font-size: var(--font-size);
}
.fd-save-btn {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.fd-save-btn:hover {
  background: var(--color-primary-hover);
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FormDesigner
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/components/FormDesigner.vue src/sdk/components/__tests__/FormDesigner.spec.ts
git commit -m "feat(sdk): add FormDesigner component with 3 modes (skeleton)"
```

---

## 任务 12：FormRenderer 组件

**文件：**
- 创建：`src/sdk/components/FormRenderer.vue`
- 创建：`src/sdk/components/__tests__/FormRenderer.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/components/__tests__/FormRenderer.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormRenderer from '../FormRenderer.vue'
import type { FormTemplate } from '../../types'

describe('FormRenderer', () => {
  it('renders all components from template', () => {
    const tpl: FormTemplate = {
      id: 't1',
      components: [
        { id: '1', type: 'Input', field: 'name', label: '姓名' },
        { id: '2', type: 'InputNumber', field: 'age', label: '年龄' }
      ]
    }
    const wrapper = mount(FormRenderer, {
      props: { component: tpl }
    })
    expect(wrapper.findAll('input').length).toBeGreaterThanOrEqual(2)
  })

  it('emits update:formData on field change', async () => {
    const tpl: FormTemplate = {
      id: 't1',
      components: [
        { id: '1', type: 'Input', field: 'name', label: '姓名' }
      ]
    }
    const wrapper = mount(FormRenderer, {
      props: { component: tpl, formData: {} }
    })
    const input = wrapper.find('input')
    await input.setValue('Alice')
    const events = wrapper.emitted('update:formData')
    expect(events?.[0]?.[0]).toEqual({ name: 'Alice' })
  })

  it('initializes formData with default values', () => {
    const tpl: FormTemplate = {
      id: 't1',
      components: [
        { id: '1', type: 'Input', field: 'name', label: '姓名' },
        { id: '2', type: 'InputNumber', field: 'age', label: '年龄' }
      ]
    }
    const wrapper = mount(FormRenderer, {
      props: { component: tpl, formData: { name: 'Bob', age: 30 } }
    })
    const nameInput = wrapper.find('input[type="text"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Bob')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FormRenderer
```

预期：FAIL。

- [ ] **步骤 3：实现 FormRenderer.vue**

文件：`src/sdk/components/FormRenderer.vue`

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormRendererProps, FormRendererEmits } from '../types'
import FieldPreview from '../internal/canvas/FieldPreview.vue'

const props = defineProps<FormRendererProps>()
const emit = defineEmits<FormRendererEmits>()

const localData = ref<Record<string, any>>(props.formData ?? {})

watch(() => props.formData, (val) => {
  if (val) localData.value = { ...val }
}, { deep: true })

function onFieldChange(field: string, value: any) {
  localData.value = { ...localData.value, [field]: value }
  emit('update:formData', localData.value)
  emit('field-change', { field, value })
}
</script>

<template>
  <div class="fd-renderer">
    <FieldPreview
      v-for="c in component.components"
      :key="c.id"
      :component="c"
      :modelValue="localData[c.field]"
      @update:modelValue="(v: any) => onFieldChange(c.field, v)"
    />
  </div>
</template>

<style scoped>
.fd-renderer {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FormRenderer
```

预期：3 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/components/FormRenderer.vue src/sdk/components/__tests__/FormRenderer.spec.ts
git commit -m "feat(sdk): add FormRenderer component"
```

---

## 任务 13：构建配置（vite lib mode）

**文件：**
- 修改：`vite.config.ts`
- 修改：`package.json`
- 修改：`tsconfig.json`（如有需要）

- [ ] **步骤 1：修改 vite.config.ts**

文件：`vite.config.ts`（重写）

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      build: {
        lib: {
          entry: fileURLToPath(new URL('./src/sdk/index.ts', import.meta.url)),
          name: 'FormDesignerSDK',
          fileName: (format) => `form-designer-sdk.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue'
            }
          }
        },
        sourcemap: true
      }
    }
  }

  // 默认 dev 模式（保持原 dev demo 配置）
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
```

- [ ] **步骤 2：修改 package.json**

修改 `package.json`：

```json
{
  "name": "form-designer-sdk",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/form-designer-sdk.umd.js",
  "module": "./dist/form-designer-sdk.es.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "exports": {
    ".": {
      "import": "./dist/form-designer-sdk.es.js",
      "require": "./dist/form-designer-sdk.umd.js"
    }
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "build:sdk": "vue-tsc -b && vite build --mode lib",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

（注：保留原 `name` 字段，如果项目当前不是这个名字，先确认再改。）

- [ ] **步骤 3：创建 src/sdk/index.ts**

文件：`src/sdk/index.ts`

```ts
export { default as FormDesigner } from './components/FormDesigner.vue'
export { default as FormRenderer } from './components/FormRenderer.vue'

export type {
  ComponentDef,
  FormTemplate,
  BasicComponentType,
  RuleDef,
  RuleAction,
  RuleActionType,
  RuleType,
  TriggerType,
  FormDesignerMode,
  FormDesignerProps,
  FormDesignerEmits,
  FormRendererProps,
  FormRendererEmits
} from './types'

export { isValidComponentDef, validateTemplate } from './internal/validate'
export type { ValidationResult } from './internal/validate'
```

- [ ] **步骤 4：跑 build:sdk 验证**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm run build:sdk
```

预期：`dist/form-designer-sdk.es.js` 和 `dist/form-designer-sdk.umd.js` 生成成功。

- [ ] **步骤 5：跑全部测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test
```

预期：所有测试通过。

- [ ] **步骤 6：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add vite.config.ts package.json src/sdk/index.ts
git commit -m "build(sdk): add vite lib mode config and npm entry"
```

---

## 任务 14：集成测试

**文件：**
- 创建：`src/sdk/__tests__/integration.spec.ts`

- [ ] **步骤 1：写集成测试**

文件：`src/sdk/__tests__/integration.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FormDesigner from '../components/FormDesigner.vue'
import FormRenderer from '../components/FormRenderer.vue'
import type { ComponentDef, FormTemplate } from '../types'

describe('SDK integration', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('field mode edit -> save -> store as ComponentDef -> use in basic mode', async () => {
    // 1. field 模式编辑一个小项目
    const def: ComponentDef = {
      id: 'temp-1', type: 'Input', field: 'patientName', label: '患者姓名', required: true
    }
    const fieldWrapper = mount(FormDesigner, {
      props: { mode: 'field', component: def }
    })

    // 2. 用户编辑（label 改成新值）
    const labelInput = fieldWrapper.findAll('input')[0]
    await labelInput.setValue('姓名（必填）')

    // 3. 触发 save 事件
    const updatedDef = fieldWrapper.emitted('update:component')?.[0]?.[0] as ComponentDef
    expect(updatedDef.label).toBe('姓名（必填）')

    // 4. 模拟后端返回真实 id
    const savedDef: ComponentDef = { ...updatedDef, id: 'real-id-123' }

    // 5. 用作 preset 放进 presets 模式
    const tpl: FormTemplate = { id: 't1', components: [] }
    const presetsWrapper = mount(FormDesigner, {
      props: { mode: 'presets', component: tpl, components: [savedDef] }
    })
    // 6. 点击 preset 加入
    await presetsWrapper.findAll('.fd-lib-item')[0].trigger('click')
    const newTpl = presetsWrapper.emitted('update:component')?.[0]?.[0] as FormTemplate
    expect(newTpl.components).toHaveLength(1)
    expect(newTpl.components[0].label).toBe('姓名（必填）')

    // 7. 用 FormRenderer 渲染
    const renderer = mount(FormRenderer, {
      props: { component: newTpl, formData: { patientName: '张三' } }
    })
    const inputs = renderer.findAll('input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('张三')
  })

  it('basic mode drag-add -> edit -> save -> render', async () => {
    // 1. 初始空模板
    const tpl: FormTemplate = { id: 't1', components: [] }
    const wrapper = mount(FormDesigner, {
      props: { mode: 'basic', component: tpl }
    })

    // 2. 点 library 添加 Input
    const libItems = wrapper.findAll('.fd-lib-item')
    await libItems[0].trigger('click')  // Input

    const updatedTpl = wrapper.emitted('update:component')?.[0]?.[0] as FormTemplate
    expect(updatedTpl.components).toHaveLength(1)
    expect(updatedTpl.components[0].type).toBe('Input')

    // 3. 渲染
    const renderer = mount(FormRenderer, {
      props: { component: updatedTpl, formData: {} }
    })
    expect(renderer.find('input').exists()).toBe(true)
  })
})
```

- [ ] **步骤 2：跑集成测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- integration
```

预期：2 个 test 通过。

- [ ] **步骤 3：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/__tests__/integration.spec.ts
git commit -m "test(sdk): add integration tests for full flow"
```

---

## 自检

- [x] **规格覆盖度**：
  - §3.1 公开类型 → 任务 1
  - §3.2 FormDesigner 3 mode → 任务 11
  - §3.3 FormRenderer → 任务 12
  - §3.4 自实现 UI 库（计划 A）→ 不在此计划内
  - §4 数据流 → 任务 4（store）、任务 10/11（事件）
  - §5 错误处理 → 任务 2（validate）
  - §6 测试策略 → 任务 2-12 各组件单测 + 任务 14 集成测试
  - §7 包结构与构建 → 任务 13
  - §9 决策摘要 #2 SDK 组件 → 任务 11/12 实现
  - §9 决策摘要 #8 preset 模式产物 → 任务 11 验证
  - §9 决策摘要 #9 基础组件来源 → 计划 A 产出 + 任务 3 metadata

- [x] **占位符扫描**：
  - 全部代码完整，无 TODO/待定/类似任务 N
  - 测试断言具体

- [x] **类型一致性**：
  - `ComponentDef` 在所有任务中字段一致（id、type、field、label、required?、columns?、props?、rules?）
  - `FormTemplate` 字段一致（id、version?、components、metadata?）
  - `FormDesignerProps` 字段一致（mode、component、components?、readonly?）
  - `modelValue` / `update:modelValue` 在所有 UI 组件一致
  - 事件 `save` / `cancel` / `update:component` 一致

## 执行交接

**计划已完成并保存到 `docs/superpowers/plans/2026-07-21-sdk-refactor.md`**。

14 个任务，含公开类型、校验、store、规则引擎迁移、canvas/property/library 子组件、FormDesigner/FormRenderer、构建配置、集成测试。

依赖计划 A；产出可发布到 npm 的 SDK。

两种执行方式：
1. **子代理驱动（推荐）** — 每个任务调度一个新的子代理
2. **内联执行** — 当前会话批量执行

**选哪种方式？**
