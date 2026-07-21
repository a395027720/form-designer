# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

检查报告动态表单设计器原型 — 基于 Vue 3 + Vite + Ant Design Vue 4 的单页应用，让运营/医务人员通过可视化设计器配置检查报告模板（JSON Schema），渲染器消费模板即可渲染录入页面，无需发版即可新增报告类型。

## 常用命令

```bash
# 开发服务器（localhost:5173）
npm run dev

# 类型检查 + 构建
npm run build

# 预览构建产物
npm run preview
```

本项目无测试套件（原型阶段）。

## 技术栈

- **Vue 3.5** (Composition API + `<script setup>`)
- **Vite 6** + `@vitejs/plugin-vue`
- **TypeScript 5.6** (strict 模式，`noImplicitAny: false`)
- **Pinia 2** (状态管理)
- **Vue Router 4** (History 模式)
- **Ant Design Vue 4** (UI 组件库)
- **SortableJS** (画布拖拽排序)
- **路径别名** `@/` → `src/`

## 架构：三大页面 + 规则引擎

```
TemplateList（模板列表）
    ↓ 选择模板进入编辑
Designer（设计器 = 三栏布局）
    ├─ ComponentLibrary  左侧：可拖拽组件库（10 种组件类型）
    ├─ DesignerCanvas    中间：字段预览 + 排序/删除/复制
    └─ PropertyPanel     右侧：属性编辑 + 规则编辑器
    ↓ 保存为 JSON 模板（localStorage）
Renderer（渲染器 = FormRenderer）
    ├─ RuleEngine        规则引擎（值变化分发 + 规则求值 + 副作用收集）
    ├─ ExpressionEvaluator  自研递归下降表达式解析器
    └─ ActionApplier     将副作用写入集中式 FieldState Map
```

## 核心数据模型（`src/types/template.ts`）

- **FormTemplate**: 模板顶层结构（version, id, layout, components[]）
- **ComponentDef**: 单个表单字段（id, type, field, label, rules[], columns 宽度）
- **RuleDef**: 规则定义（id, type, trigger, enabled, params），5 种类型：
  - `calculation` — 表达式计算（如 a + b / 2）
  - `threshold` — 阈值分级（值在区间内触发标签/颜色）
  - `comparison` — 比较（左值 vs 右值，匹配时触发副作用）
  - `conditional` — 条件显隐（when-then-else）
  - `validation` — 校验（required/min/max/regex）
- **RuleAction**: 副作用目标（setStyle/addClass/show/hidden/setText/setRequired），target 用 `$.components.{id}` / `$.self` 路径语法
- **表达式语法**: `$.components.{id}.value` 引用其他字段值，支持 `Math.max/min/abs/round/floor/ceil`

## 数据流

```
localStorage ←→ templateApi（CRUD + 导出/导入 JSON）
                    ↓
            Pinia templateStore（当前编辑模板的响应式状态）
                    ↓
        Designer 组件（修改 components/rules）
                    ↓
        JSON 序列化存入 localStorage
                    ↓
        FormRenderer 读取 template，new RuleEngine 消费
```

## 关键设计决策

1. **不需要后端**：所有持久化走 localStorage（`check-report-templates` key），首次访问自动注入两个示例模板（血常规、肝功能）
2. **表达式解析器自研**：`ExpressionEvaluator` 是手写递归下降解析器（词法 → AST → 求值），不引入第三方数学库。支持 `+ - * / ( )` 和 `Math.*` 函数
3. **集中式副作用管理**：FormRenderer 维护 `states: Record<string, FieldState>`（visible/style/suffix/classes/required/autoCalculated），ActionApplier 通过 `setFieldState` 回调写入，字段组件纯展示。这避免了三方库规则引擎的复杂度
4. **计算字段保护**：autoCalculated 标记防止用户手动覆盖计算结果
5. **规则编辑只支持新增**（原型限制），不支持编辑已存在的规则；模板无版本管理

## 已知限制（引自 README）

- 规则编辑只支持新增，不支持编辑已存在规则（M5 阶段延后）
- 模板没有版本管理
- localStorage 容量限制（~5MB），演示足够
- antd vue3 的 `a-menu` `@click` 回调使用 `{ key }` 参数，需保证 menu-item 有 key
