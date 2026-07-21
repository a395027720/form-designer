# form-designer SDK 设计文档

> 日期：2026-07-21
> 状态：草案，待用户审查
> 目标：把现有 form-designer 重构为可发布到 npm 的 Vue 3 SDK

---

## 1. 概述

### 1.1 目标

将现有 `form-designer` 项目重构为可通过 npm 分发的 Vue 3 组件库。SDK 暴露 **FormDesigner**（设计器，3 种 mode）和 **FormRenderer**（渲染器，无 mode）以及配套 TypeScript 类型，外部开发者可将其嵌入产品配置动态表单。

### 1.2 业务场景

业务端存在两个层级：

- **小项目（ComponentDef）**：单个表单字段定义，如"总胆红素"、"身份证号"。业务方通过 `FormDesigner mode="field"` 编辑产出，存入后端。
- **大项（FormTemplate）**：由若干字段拼成的完整表单模板。两种组装方式：
  - `mode="basic"`：从 SDK 内置的 antd 基础组件直接拖入拼装（"现在的样子"）
  - `mode="presets"`：从后端预制的"小项目"清单（`:components` prop）挑 1 个拼入

实际使用流程：

```
[业务编辑"小项目"]   →  <FormDesigner mode="field" v-model:component="def" @save>
                       →  consumer 调后端存 ComponentDef
                       
[组建大项 - 自由拼]  →  <FormDesigner mode="basic" v-model:component="tpl" @save>
                       →  左侧 antd 10 种基础组件，拖入 inline
                       
[组建大项 - 选小项目] →  <FormDesigner mode="presets" v-model:component="tpl" :components="list" @save>
                       →  从小项目清单挑 1 个 inline 复制
                       
[渲染大项]            →  <FormRenderer :component="tpl" v-model:formData>
```

---

## 2. SDK 暴露范围

### 2.1 进 SDK（npm 暴露）

- **FormDesigner** 组件，3 种 mode（详见第 3 节）
- **FormRenderer** 组件（无 mode，只渲染 FormTemplate）
- 公开 TypeScript 类型：`ComponentDef`、`FormTemplate`、`RuleDef`、`RuleAction`
- 规则引擎（RuleEngine、ExpressionEvaluator、ActionApplier）
- 内部自实现 antd 风格 UI 组件库（10 种，详见 §3.4）
- 校验函数：`isValidComponentDef`、`validateTemplate`

### 2.2 不进 SDK（保留为 dev demo）

- `src/pages/TemplateList.vue`、`src/pages/Designer.vue`、`src/pages/Renderer.vue`
- 路由 `src/router/`
- 模板列表状态管理 `src/stores/templateStore.ts`
- 模拟后端 `src/api/templateApi.ts`（localStorage）
- 示例数据 `src/data/sampleTemplates.ts`
- `App.vue`、`main.ts`（dev demo 入口）

dev demo 仍保留在仓库内用于本地开发和演示，但通过 `vite.config.ts` 的 `build.lib` 模式打包时不会进入 npm 包。

---

## 3. 公开 API

### 3.1 公开类型

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

/** 组件定义（"小项目" = 一个具体字段，field 模式产物 = 裸 ComponentDef） */
export interface ComponentDef {
  id: string                                  // 后端生成；编辑期可用临时 ID
  type: BasicComponentType                    // 见 BasicComponentType
  field: string                               // 表单字段名（最终 formData 的 key）
  label: string                               // 显示标签
  required?: boolean
  columns?: number                            // 24 栅格
  props?: Record<string, any>                 // 透传给自实现 UI 组件的属性
  rules?: RuleDef[]
}

/** 模板定义（大项，basic / presets 模式产物） */
export interface FormTemplate {
  id: string
  version?: string
  components: ComponentDef[]                  // **纯 inline**，无 ref 概念
  metadata?: Record<string, any>
}

/** 规则定义（沿用现有 5 种类型） */
export type RuleDef =
  | CalculationRule
  | ThresholdRule
  | ComparisonRule
  | ConditionalRule
  | ValidationRule

export interface RuleAction {
  type: 'setStyle' | 'addClass' | 'show' | 'hidden' | 'setText' | 'setRequired'
  target: string                              // '$.self' | '$.components.<id>'
  payload?: any
}
```

**注**：基础组件清单（antd 10 种）由 SDK 内部硬编码，**不通过 prop 暴露**。

### 3.2 FormDesigner

```ts
type FormDesignerMode = 'field' | 'basic' | 'presets'

interface FormDesignerProps {
  mode: FormDesignerMode

  // v-model：单数 prop
  component: ComponentDef | FormTemplate

  // presets 模式专用：清单（小项目数组）
  components?: ComponentDef[]

  // 可选
  readonly?: boolean                          // 全局只读：禁用所有编辑入口（包括布局）
}

interface FormDesignerEmits {
  (e: 'update:component', value: ComponentDef | FormTemplate): void
  (e: 'save', value: ComponentDef | FormTemplate): void
  (e: 'cancel'): void
}
```

#### 三种 mode 能力矩阵

| 操作 | `field` | `basic` | `presets` |
|---|---|---|---|
| 形态 | 单组件 | 多组件 | 多组件 |
| 额外 prop | 无 | **无** | `components`（小项目清单） |
| 左侧内容 | SDK 硬编码 10 种 antd 基础组件 | SDK 硬编码 10 种 antd 基础组件 | `components` prop 里的"小项目" |
| 拖入行为 | 点选切换中间预览的 `type` | **inline 写入** FormTemplate.components[] | **inline 复制**（生成新 id） |
| 拖入上限 | 1 个（点选切换） | 多个 | **1 个**；拖入后左侧清单隐藏 |
| 列宽 | — | 可调（24 栅格） | 固定 24（整行） |
| 排序 | — | ✅ | ❌（仅 1 项） |
| 删除画布项 | — | ✅ | ✅（删后左侧清单重新显示） |
| 改画布项属性 | ✅ | ✅ | ❌ |
| 产物 | ComponentDef | FormTemplate（inline） | FormTemplate（inline，最多 1 项） |
| 触发 `update:component` | ✅ | ✅ | ✅ |
| 触发 `save` | ✅ | ✅ | ✅ |

#### field 模式 UI（单组件，编辑"小项目"）

```
┌────────────────────────────────────────────┐
│ [保存] [取消]                              │
├──────────┬─────────────────────────────────┤
│ 组件库   │ 字段预览                          │
│          │                                  │
│ ▸ 基础   │  ┌────────────────────────────┐ │
│   Input  │  │ 患者姓名 *                   │ │
│   InputN │  │ [请输入____________]       │ │
│   Select │  └────────────────────────────┘ │
│   Date   │                                  │
│   ...    │  属性：                          │
│          │  label: [患者姓名]               │
│          │  field: [patientName1]           │
│          │  required: [✓]                  │
│          │  ...                             │
│          │  规则：[+ 添加规则]              │
└──────────┴─────────────────────────────────┘
```

- 左侧为 SDK 硬编码的 antd 10 种基础组件，**点选**切换中间预览的 `type`
- 中间是只读预览（实际渲染 antd 组件）
- 右侧属性面板编辑 `label / field / required / columns / props`
- 规则区域沿用现有 5 种 RuleEditor
- v-model 的是单个 ComponentDef

#### basic 模式 UI（多组件，"现在的样子"）

```
┌────────────────────────────────────────────┐
│ [保存] [取消]                              │
├──────────┬─────────────────────────────────┤
│ 组件库   │ 画布（多字段）                    │
│          │                                  │
│ ▸ 基础   │  ┌─ 字段1 ──────── [×] ┐        │
│   Input  │  │  type:Input 24列    │        │
│   InputN │  └─────────────────────┘        │
│   Select │  ┌─ 字段2 ──────── [×] ┐        │
│   ...    │  │  type:Select 12列   │        │
│          │  └─────────────────────┘        │
└──────────┴─────────────────────────────────┘
```

- 左侧为 SDK 硬编码的 antd 10 种基础组件
- 拖入画布 = inline 写入 `FormTemplate.components[]`（完整的 ComponentDef）
- 排序、删除、列宽调整通过 SortableJS
- 点击画布项可编辑属性（v-model:component 触发更新）

#### presets 模式 UI（多组件，从小项目清单挑 1 个）

```
初始：
┌────────────────────────────────────────────┐
│ [保存] [取消]                              │
├──────────┬─────────────────────────────────┤
│ 小项目   │ 画布（空）                        │
│          │                                  │
│ ▸ 业务   │                                  │
│   胆红素 │                                  │
│   谷丙   │                                  │
│   ...    │                                  │
└──────────┴─────────────────────────────────┘

拖入一个后：
┌────────────────────────────────────────────┐
│ [保存] [取消]                              │
├──────────┬─────────────────────────────────┤
│          │ 画布                              │
│  (清单   │  ┌─ 总胆红素 ───── [×] ┐         │
│   隐藏)  │  │  整行 24列             │         │
│          │  │  属性只读              │         │
│          │  └───────────────────────┘         │
└──────────┴─────────────────────────────────┘
```

- 左侧显示 `components` prop 里的"小项目"列表
- 拖一个到画布 = inline 复制 + 生成新 id + 占整行
- **拖入后左侧清单隐藏**
- 画布项属性**完全不能改**
- 可删除（删后左侧清单重新显示）

#### `readonly` 字段

`readonly?: boolean` 是**全局**只读开关，叠加在所有 mode 之上：
- `readonly=true` 时：所有 mode 都禁用所有编辑入口（包括布局操作）
- 不与 mode 冲突：mode 决定默认能力，readonly 决定是否整体禁用

### 3.3 FormRenderer

```ts
interface FormRendererProps {
  component: FormTemplate                      // 必填，只接 FormTemplate
  formData?: Record<string, any>              // v-model
}

interface FormRendererEmits {
  (e: 'update:formData', data: Record<string, any>): void
  (e: 'field-change', payload: { field: string, value: any }): void
}
```

- 内部走现有 RuleEngine
- 遍历 `template.components`（纯 inline，无 ref 解析逻辑）
- 按各 `ComponentDef.type` 渲染 antd 组件
- **不**渲染单个 `ComponentDef`（即 FormRenderer 永远接收 FormTemplate，不接收单字段）

### 3.4 自实现 UI 组件库

SDK **不依赖** antd。所有 UI（包括设计器工具 UI 和渲染器业务字段 UI）都由 SDK 内部 `internal/ui` 模块提供，组件样式模仿 antd 视觉风格。

#### 内部 UI 模块暴露的 10 种基础组件

| 组件 | 用于设计器 | 用于渲染器 | 说明 |
|---|---|---|---|
| `Input` | ✅ 工具表单输入 | ✅ 字段渲染 | 单行文本 |
| `Textarea` | ✅ 工具表单输入 | ✅ 字段渲染 | 多行文本 |
| `InputNumber` | ✅ 工具表单输入 | ✅ 字段渲染 | 数字输入 |
| `Select` | ✅ 工具表单下拉 | ✅ 字段渲染 | 下拉选择 |
| `RadioGroup` | ✅ 工具表单单选 | ✅ 字段渲染 | 单选组 |
| `CheckboxGroup` | ✅ 工具表单多选 | ✅ 字段渲染 | 多选组 |
| `DatePicker` | ✅ 工具日期选择 | ✅ 字段渲染 | 日期选择 |
| `TimePicker` | ✅ 工具时间选择 | ✅ 字段渲染 | 时间选择 |
| `Switch` | ✅ 工具开关 | ✅ 字段渲染 | 开关 |
| `DisplayText` | ✅ 静态文本 | ✅ 字段渲染 | 只读展示 |

**两类用途说明**：
- **设计器工具 UI**（左侧组件库、属性面板、规则编辑器等）：SDK 内部直接用自实现 UI 组件搭建
- **渲染器业务字段**（用户填写的实际表单）：`FormRenderer` 遍历 `tpl.components[]` 时按 `type` 用自实现 UI 组件渲染

#### 设计要点

- **视觉一致**：模仿 antd 4 的颜色、间距、圆角、字号等 token；不需要逐像素一致
- **API 兼容**：每个组件的 `props` 命名与 antd 对齐（`placeholder`、`maxLength`、`value` 等），方便后续如果想换回 antd 也行
- **功能范围**：v1 只实现"够用"——校验、格式化、键盘交互等不追求 antd 完整度；只保证 `FormRenderer` 现有功能可跑
- **a11y / i18n**：暂不做

#### 不再需要 antd

```json
// package.json
{
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

消费者**只装 Vue**，不需要装 antd。SDK 包自包含。

---

## 4. 数据流

### 4.1 field 模式（编辑"小项目"）

```
1. consumer 创建空 ComponentDef（label/field 已设）传入
   <FormDesigner mode="field" v-model:component="def" @save="onSave" />

2. SDK 内部生成临时 ID（前端 nanoid，仅作 v-for key 用），不影响 v-model

3. 用户在 SDK 内编辑 props/rules（不调任何后端）

4. 用户点 [保存]
   → SDK emit('save', def)
   → consumer:
       const saved = await api.createField(def)  // 后端生成 ID
       def.id = saved.id                          // 写回

5. 用户点 [取消]
   → SDK emit('cancel')
   → consumer 自行处理（关闭弹窗、还原路由等）
```

### 4.2 basic 模式（编辑大项，"现在的样子"）

```
1. consumer 传入 FormTemplate
   <FormDesigner mode="basic" v-model:component="tpl" @save />

2. SDK 内部对每个 ComponentDef 生成临时 ID（仅作 v-for key）

3. 用户从左侧 antd 基础组件拖入画布
   → SDK 生成完整 ComponentDef 写入 tpl.components[]
   → 触发 v-model:component 更新

4. 用户排序/改列宽/删除/编辑属性
   → 触发 v-model:component 更新

5. 用户点 [保存]
   → emit('save', tpl)
   → tpl.components[] 是纯 inline
   → consumer 调后端
```

### 4.3 presets 模式（从小项目清单挑 1 个，inline 复制）

```
1. consumer 传入 FormTemplate + components（"小项目"清单）
   <FormDesigner mode="presets" v-model:component="tpl" :components @save />

2. 初始：左侧显示 components，画布空

3. 用户从左侧拖一个 ComponentDef 到画布
   → SDK 把 ComponentDef 完整内容**复制一份**到 tpl.components[]
   → 复制时生成新 id（避免与原 components 内的 id 冲突）
   → 拖入即 inline，不再依赖 components
   → 拖入后**左侧 components 隐藏**
   → 该画布项**占整行（24 列），列宽不能调**

4. 画布项的属性（type/label/field/props/rules）**完全不能改**

5. 用户可删除画布项
   → 删除后**左侧 components 重新显示**
   → 等待用户再次拖入（重新选一个）

6. 用户点 [保存]
   → emit('save', tpl)
   → tpl.components[] 是纯 inline（最多 1 个 ComponentDef）
   → consumer 调后端
```

### 4.4 RuleEngine

由于 `FormTemplate.components` 全是 inline，RuleEngine **不需要 ref 解析逻辑**——所有 `$.components.<id>.value` 引用都在同一个 `tpl.components[]` 里直接查。

这意味着 RuleEngine 可以**沿用现有实现**，不需要任何改造。

---

## 5. 错误处理

| 场景 | SDK 行为 |
|---|---|
| 表达式求值抛错 | 字段值保持原值 + `console.error` |
| components 数组缺字段 | 启动时 `console.warn` 列出非法项 |
| 保存失败 | SDK **不感知**，由 consumer 处理 |
| renderer 抛错 | `errorCaptured` 错误边界兜底，渲染错误占位 |
| type 识别不出 | 渲染占位 + `console.warn` |

**核心原则**：SDK 永不抛未捕获错误到消费者。所有失败路径降级为控制台日志 + UI 占位。

公开校验函数（dev 用）：

```ts
export function isValidComponentDef(x: unknown): x is ComponentDef
export function validateTemplate(t: unknown): { ok: boolean, errors: string[] }
```

---

## 6. 测试策略

### 6.1 单元测试（必需）

- `RuleEngine`：5 种规则 × inline components 场景
- `ExpressionEvaluator`：现有基础上验证求值正确性
- `ActionApplier`：副作用合并测试
- `validateTemplate` / `isValidComponentDef`：合法/非法各 5 个

### 6.2 组件测试（Vue Test Utils）

- `<FormDesigner mode="field">`：渲染快照、props 变更响应、emit 验证
- `<FormDesigner mode="basic">`：拖入、排序、删除、属性编辑
- `<FormDesigner mode="presets">`：单选、拖入后清单隐藏、属性只读
- `<FormRenderer>`：inline components 渲染、规则触发

### 6.3 集成测试

- 端到端：field 模式编辑 → 保存 → 模拟后端返回 ID → 写入 field
- 端到端：basic 模式拖入基础组件 → 编辑属性 → 保存 → FormRenderer 渲染
- 端到端：presets 模式从清单挑 1 个 → 保存 → FormRenderer 渲染

### 6.4 覆盖率目标

- RuleEngine / ActionApplier / ExpressionEvaluator：**90%+**
- 组件层：**70%+**

### 6.5 不做的事

- E2E 浏览器测试（Playwright）：SDK 内部逻辑已被单测和组件测覆盖
- dev demo 的测试：dev demo 不发布，坏了不阻塞 npm

---

## 7. 包结构与构建

### 7.1 目录调整

```
src/
├── sdk/                          # ★ 新增：纯 SDK（要发布）
│   ├── index.ts                  # 主入口
│   ├── types.ts                  # 公开类型
│   ├── components/
│   │   ├── FormDesigner.vue     # 3 mode 合一
│   │   └── FormRenderer.vue     # 只接 FormTemplate
│   ├── runtime/
│   │   ├── RuleEngine.ts
│   │   ├── ExpressionEvaluator.ts
│   │   └── ActionApplier.ts
│   ├── internal/
│   │   ├── ui/                  # ★ 自实现 antd 风格 UI 组件库
│   │   │   ├── Input.vue
│   │   │   ├── Textarea.vue
│   │   │   ├── InputNumber.vue
│   │   │   ├── Select.vue
│   │   │   ├── RadioGroup.vue
│   │   │   ├── CheckboxGroup.vue
│   │   │   ├── DatePicker.vue
│   │   │   ├── TimePicker.vue
│   │   │   ├── Switch.vue
│   │   │   ├── DisplayText.vue
│   │   │   ├── styles.css       # 模仿 antd 视觉的全局样式
│   │   │   └── index.ts         # 统一导出
│   │   ├── basicComponents.ts   # 10 种基础组件元数据
│   │   ├── canvas/              # FieldPreview、CanvasItem
│   │   ├── property/            # PropertyPanel
│   │   ├── rules/               # 5 个 RuleEditor
│   │   ├── library/             # ComponentLibrary（field/basic/presets 各一个变体）
│   │   └── validate.ts          # isValidComponentDef, validateTemplate
│   └── stores/
│       └── designerStore.ts
├── components/                   # dev demo 仍可引用 sdk 外的部分
├── pages/                        # dev demo
├── stores/                       # dev demo（templateStore）
├── api/                          # dev demo（templateApi）
├── data/                         # dev demo
├── router/                       # dev demo
├── App.vue                       # dev demo
└── main.ts                       # dev demo 入口
```

### 7.2 构建配置

`vite.config.ts` 增加 `build.lib` 模式：

```ts
// vite.config.ts
export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      build: {
        lib: {
          entry: 'src/sdk/index.ts',
          name: 'FormDesignerSDK',
          fileName: (format) => `form-designer-sdk.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          external: ['vue']
        }
      }
    }
  }
  // 原有 dev/demo 配置
})
```

```json
// package.json scripts
{
  "dev": "vite",
  "build": "vue-tsc -b && vite build",
  "build:sdk": "vue-tsc -b && vite build --mode lib",
  "preview": "vite preview"
}
```

### 7.3 公开入口

```ts
// src/sdk/index.ts
export { FormDesigner, FormRenderer } from './components'
export type {
  ComponentDef,
  FormTemplate,
  RuleDef,
  RuleAction,
  FormDesignerProps,
  FormDesignerEmits,
  FormRendererProps,
  FormRendererEmits,
} from './types'
export { isValidComponentDef, validateTemplate } from './internal/validate'
```

---

## 8. 已知限制 / 不做的事

1. **规则编辑只支持新增，不支持编辑/删除已存在规则**（沿用现有 M5 限制）
2. **模板无版本管理**
3. **FormTemplate 不再含 `layout` 字段**：现有项目删掉
4. **localStorage / 模拟后端**不打包：消费者自己接 API
5. **i18n 不做**：文案写中文（自实现 UI 组件内部用）
6. **E2E 测试不做**
7. **没有 ref 引用机制**：所有 FormTemplate.components[] 都是 inline ComponentDef

---

## 9. 决策摘要

| # | 决策点 | 选定方案 |
|---|---|---|
| 1 | 目标用户 | npm 外部消费者 |
| 2 | SDK 组件 | `FormDesigner`（3 mode）+ `FormRenderer`（无 mode） |
| 2.5 | prop 命名 | `component`（v-model，单数） / `components`（presets 模式的小项目清单，复数） |
| 3 | FormDesigner mode | `field`（单组件编辑小项目） / `basic`（多组件编辑大项，inline 拖入 antd 基础组件） / `presets`（多组件从清单挑 1 个，inline 复制） |
| 4 | FormRenderer | 无 mode，永远接 `FormTemplate` |
| 5 | field 模式产物 | 裸 `ComponentDef`（id 后端生成） |
| 6 | basic 模式产物 | `FormTemplate`（components[] 纯 inline） |
| 6.5 | presets 模式产物 | `FormTemplate`（components[] 纯 inline，最多 1 个 ComponentDef） |
| 6.6 | presets 拖入机制 | inline 复制 ComponentDef 并生成新 id，不依赖原清单 |
| 6.7 | presets 拖入上限 | **1 个**；拖入后左侧清单隐藏，列宽固定 24（整行） |
| 7 | ref 引用机制 | **没有**——所有 FormTemplate.components[] 都是 inline |
| 8 | 小项目清单传递 | 单一 prop：`components`（presets 模式用） |
| 9 | 基础组件来源 | SDK 内部硬编码，consumer 不传 |
| 10 | UI 组件 | SDK **自实现** antd 风格 UI 组件库（10 种），不依赖 antd |
| 11 | 现有 demo | 保留为 dev demo，npm 不暴露 |
| 12 | 保存动作 | SDK emit 事件，consumer 调后端 |
| 13 | FormTemplate 字段 | 只剩 `id + components (+可选 version / metadata)`，删除 `layout` |
| 14 | RuleEngine 改造 | **不需要**——components[] 全 inline，引用直接查同数组 |

---

## 10. 开放问题

（已全部确认，无遗留）

- [x] dev demo 重构为"小项目 + 大项"双列表形式（确认）
- [x] preset 模式画布项删除后，左侧清单重新显示（确认）
