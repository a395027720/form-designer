# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

检查报告动态表单设计器 — 基于 Vue 3 + Vite + Ant Design Vue 4 的单页应用，让运营/医务人员通过可视化设计器配置检查报告模板（JSON Schema），渲染器消费模板即可渲染录入页面，无需发版即可新增报告类型。

设计器与渲染器都封装在 `src/components/form-designer/` 下，可作为业务组件直接复用。

## 常用命令

```bash
npm run dev      # 开发服务器（localhost:5173）
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览构建产物
```

本项目无自动化测试套件（原型阶段）。

## 技术栈

- **Vue 3.5** (Composition API + `<script setup>`)
- **Vite 6** + `@vitejs/plugin-vue`
- **TypeScript 5.6**（strict 模式，`noImplicitAny: false`）
- **Vue Router 4**（History 模式）
- **Ant Design Vue 4**（UI 组件库，主界面与规则编辑器统一使用 antd）
- **SortableJS**（画布拖拽排序）
- 路径别名 `@/` → `src/`（`vite.config.ts` 用 `import.meta.url` 解析，避开 `@types/node`）

**无状态管理库** — 不使用 Pinia。状态走 module-singleton ref + composable 模式（`useFields()`），组件间通信一律 Props/Emits 单向数据流。

## 三种设计模式

首页（`/`）提供三个入口，由 `FormDesigner` 组件的 `mode` prop 驱动：

| 模式 | 路由 | 入口组件 | 适用场景 |
|------|------|----------|----------|
| **basic** 自由设计 | `/templates` → 新建 basic | `BasicEditor.vue` | 从 11 种基础组件拖拽搭建，支持排序、规则配置 |
| **presets** 字段拼装 | `/templates/new/presets` | `PresetsEditor.vue` | 从已有字段库选取字段快速拼装（首次进入自动注入 15 个血液检查字段） |
| **field** 字段管理 | `/fields` | `FieldEditor.vue` | 编辑单个字段小项目（标签/类型/校验/业务规则） |

三种模式共用一套 `FormDesignerProps` / `FormDesignerEmits` 接口（item + items + save/cancel/preview）。

## 项目结构

```
src/
├── components/form-designer/       # 核心模块（设计器 + 渲染器，可独立复用）
│   ├── index.ts                    # 公开入口：组件/类型/工具函数/引擎
│   ├── types.ts                    # 统一类型（ComponentDef/FormTemplate/RuleDef 等）
│   ├── basicComponents.ts          # 11 种组件元数据 + 默认 props
│   ├── validate.ts                 # isValidComponentDef / validateTemplate
│   ├── FormDesigner.vue            # 三模式入口
│   ├── FormRenderer.vue            # 运行时渲染器
│   ├── designer/                   # 设计器子组件
│   │   ├── BasicDesigner.vue / PresetsDesigner.vue  # 三栏布局
│   │   ├── ComponentLibrary.vue / FieldLibrary.vue / PresetsLibrary.vue
│   │   ├── CanvasItem.vue / FieldPreview.vue / PropertyPanel.vue / OptionsEditor.vue
│   │   ├── stores/designerStore.ts # 纯模块函数：generateTempId / ensureTempIds
│   │   └── rules/                  # RuleList / RuleWizard / ExpressionEditor + 5 个编辑器
│   ├── runtime/                    # RuleEngine / ExpressionEvaluator / ActionApplier
│   └── utils/                      # uid.ts / describe.ts / componentIO.ts
├── views/                          # 路由页面
│   ├── HomePage.vue                # 首页三入口
│   ├── field/FieldList.vue / FieldEditor.vue
│   └── template/TemplateList.vue / BasicEditor.vue / PresetsEditor.vue / TemplateRenderer.vue
├── api/templateApi.ts              # localStorage 持久化（CRUD + 导入导出 JSON）
├── data/sampleTemplates.ts         # 首次访问注入两个示例模板（血常规、肝功能）
├── data/indicatorData.ts           # presets 模式 15 个血液检查字段
├── types/antd-mapping.ts           # 组件库元数据
├── router/index.ts                 # 9 条路由
├── styles/global.css               # 全局样式 token
└── main.ts                         # 入口（Vue + Router + Antd）
```

## 核心数据模型（`src/components/form-designer/types.ts`）

- **FormTemplate**: `{ id, version?, name?, category?, description?, components[], createdAt?, updatedAt?, metadata? }`
  - `name / category / description` 可选 — 列表展示用
- **ComponentDef**: `{ id, type, field, label, required?, unit?, defaultValue?, inputWidth?, fontColor?, fontSize?, props?, options?, api?, rules?, children? }`
- **RuleDef**: `{ id, type, name, enabled, trigger, params }`，5 种类型：
  - `calculation` — 计算规则（BMI = 体重 / 身高²）
  - `threshold` — 阈值分级（值在区间内触发标签/颜色）
  - `comparison` — 比较（左值 vs 右值，匹配时触发副作用）
  - `conditional` — 条件显隐（when-then-else，支持多个 target）
  - `validation` — 校验（required/min/max/regex/minLength/maxLength）
- **RuleAction**: `{ type, target, style?, value? }`，`type` ∈ `setValue / setStyle / addClass / removeClass / show / hidden / setText / setRequired`
- **trigger**: `onChange` / `onBlur` / `onInit`
- **表达式语法**: `$.components.{id}.value` 引用其他字段值；支持 `Math.max/min/abs/round/floor/ceil`

## 11 种基础组件类型

`Input` / `Textarea` / `InputNumber` / `Select` / `RadioGroup` / `CheckboxGroup` / `DatePicker` / `TimePicker` / `Switch` / `DisplayText` / `Upload`

## 数据流

```
localStorage (key: check-report-templates)
   ↓↑ templateApi（CRUD + 导出/导入 JSON）
   ↓
view 层（BasicEditor / PresetsEditor / FieldEditor）持有模板状态
   ↓ emit('update:item') / emit('save')
FormDesigner 组件（mode = basic|presets|field）
   ↓ 序列化
JSON 模板（FormTemplate）
   ↓ 渲染时
FormRenderer 读取 template，new RuleEngine 消费 → 维护 states Map
```

## IO 工具集（`utils/componentIO.ts`）

5 个纯函数，处理 **后端接口数据 ↔ ComponentDef** 双向转换：

| 函数 | 方向 | 用途 |
|------|------|------|
| `parseComponentJson(json)` | 接口 → 前端 | 解析后端 `fieldComponentFrontJson` |
| `injectProps(def, source, mapping)` | 接口 → 前端 | 按 mapping 把后端平铺字段注入 props（自动过滤 `null` 与空串） |
| `serializeComponentJson(def)` | 前端 → 接口 | ComponentDef → JSON 字符串 |
| `extractProps(def, mapping)` | 前端 → 接口 | injectProps 反向：props → 平铺字段 |
| `serializeRuleExpress(rules)` | 前端 → 接口 | 过滤禁用规则，去前端字段，序列化为 `fieldValExpress` |

业务方可按需组合这 5 个函数把 Java 字段名（`inputMaxVal` 等）和前端 `props.max` 桥接起来。

## 关键设计决策

1. **不发布 npm**：SDK 不再作为独立包发布，设计器/渲染器整体下沉到项目内 `src/components/form-designer/`，删除 `npm run build:sdk`、package.json 的 `lib` 入口、`form-designer-sdk` 配置
2. **不引入 Pinia**：状态走 module-singleton ref + composable（`useFields()`），组件间通信一律 Props/Emits 单向流；`main.ts` 不再 `app.use(createPinia())`
3. **规则编辑器沿用 antd**：原计划的自实现 UI 库已弃用，主界面与规则编辑器统一用 `<a-input>` `<a-select>` `<a-tabs>` `<a-modal>` 等，保留 antd 的视觉风格与 a-tag / a-table / a-collapse 的交互
4. **表达式解析器自研**：`ExpressionEvaluator` 手写递归下降（词法 → AST → 求值），支持 `+ - * / ( )` 与 `Math.max/min/abs/round/floor/ceil`，不引入第三方数学库
5. **集中式副作用管理**：FormRenderer 维护 `states: Record<string, FieldState>`（visible/style/suffix/classes/required/autoCalculated），ActionApplier 通过 `setFieldState` 回调写入，字段组件纯展示
6. **计算字段保护**：autoCalculated 标记防止用户手动覆盖计算结果
7. **持久化走 localStorage**：key 为 `check-report-templates`，`templateApi` 提供 CRUD + 导入导出 JSON，首次访问自动注入血常规、肝功能两个示例模板
8. **右侧属性面板可拖拽**：默认 340px，可调范围 280-560px（`onResizeStart`/`Move`/`End`）

## 已知限制

- 模板没有版本管理（仅靠 `version` 字段字符串）
- localStorage 容量限制（~5MB），演示足够
- 空画布拖拽首个组件偶尔不生效，双击添加作为兜底
- 无自动化测试（原型阶段）
- 旧的 `docs/superpowers/`（重构计划文档）已清理
