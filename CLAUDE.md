# CLAUDE.md

给 Claude 的项目工作指南。重点是**导航 + 行为约束**，不是产品文档。功能介绍看 `README.md`，模块位置看下文。

## 别在这做的事

- **不写 Pinia**。状态管理用 module-singleton ref / composable。`main.ts` 已无 `createPinia()`
- **不发 npm 包**。`form-designer` 就地复用，不要新增 build:sdk / lib 入口
- **不发明 UI 组件库**。所有交互统一用 antd（`<a-input>` `<a-select>` `<a-tabs>` `<a-modal>` 等）
- **不在 IO 工具里绑死字段名映射**。`componentIO.ts` 接收 mapping 对象，业务方自行决定 Java 字段 → 前端 props 的对应关系
- 不引入第三方数学库做表达式计算 — 用 `ExpressionEvaluator`

## 关键文件

- `src/components/form-designer/types.ts` — 类型唯一来源（`FormTemplate` / `ComponentDef` / `RuleDef`）
- `src/components/form-designer/basicComponents.ts` — 11 种基础组件元数据；新增组件先在这里登记，再去 `FieldPreview.vue` 加渲染分支
- `src/components/form-designer/runtime/RuleEngine.ts` — 规则引擎入口（值变化 → 求值 → 副作用）
- `src/components/form-designer/runtime/ExpressionEvaluator.ts` — 自研递归下降表达式解析器；要扩展运算符改这里
- `src/components/form-designer/runtime/ActionApplier.ts` — 副作用 → `FieldState` Map
- `src/components/form-designer/designer/PropertyPanel.vue` — 右侧面板（a-tabs：基础 / 校验 / 业务规则）
- `src/components/form-designer/designer/rules/` — 规则相关：RuleList / RuleWizard / ExpressionEditor + 5 个具体规则编辑器
- `src/components/form-designer/designer/rules/index.ts` — 规则组件入口（`PropertyPanel` 经此导入）
- `src/components/form-designer/utils/componentIO.ts` — 后端接口 ↔ ComponentDef 双向转换，新增转换函数往这里加
- `src/api/templateApi.ts` — localStorage 持久化封装（key: `check-report-templates`）
- `vite.config.ts` — 用 `import.meta.url` 解析 `@/` 别名，**不要**改成用 `path` 模块（会引入 `@types/node` 依赖）

## 工作约定

- **Props → emit 单向流**：组件不直接 v-model 修改 props，`update:xxx` 必须通过 emit
- **新增字段要先注册临时 ID**：用 `ensureTempIds()`（`designer/stores/designerStore.ts`），v-for key 别裸用 index
- **新增路由**进 `src/router/index.ts`，懒加载；路由命名用 kebab-case
- **持久化模板**走 localStorage，不要新增 IndexedDB / 远程存储
- **中文日志**：所有 console.log / 日志内容用中文

## 易踩的坑

- 空画布拖拽首组件偶发不响应，是 SortableJS 与空态 overlay 的交互问题。双击添加作为兜底，未修复时不要"顺手"改成自定义拖拽
- 表达式解析器不支持自定义函数（仅 `Math.*`）。如果业务提类似诉求，先扩展 `ExpressionEvaluator` 再加 UI
- `injectProps` 自动过滤 `null` 与空串，单元测试围绕此行为
- TypeScript `noImplicitAny: false`，但写代码时**还是该显式标注**参数类型

## 命令

```bash
npm run dev      # dev server（localhost:5173）
npm run build    # vue-tsc 类型检查 + vite build
npm run preview  # 预览 dist
```

无测试命令（原型阶段）。

## 当前模式 / 状态

- Vue 3.5 + Vite 6 + TypeScript 5.6 + Vue Router 4 + Ant Design Vue 4 + SortableJS
- 三种设计模式由 `FormDesigner` 的 `mode` prop 驱动（basic / presets / field）
- 持久化仅 localStorage；首次访问自动注入"血常规"与"肝功能"两个示例模板
- 无版本管理、无测试套件
