# 检查报告动态表单设计器（原型）

基于 **PRD.md** 实现的 Vue 3 + Vite + Antd Vue3 原型，覆盖模板列表、表单设计器、表单渲染器三大模块。

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器访问
# http://localhost:5173
```

首次访问会自动注入两个示例模板：**血常规检查报告**（含阈值分级、计算规则）和**肝功能检查报告**（含条件显隐、校验规则）。

## 项目结构

```
src/
├─ api/
│  └─ templateApi.ts             # localStorage 持久化封装
├─ types/
│  ├─ template.ts                # FormTemplate/ComponentDef/RuleDef 类型
│  └─ antd-mapping.ts            # 组件库元数据
├─ data/
│  └─ sampleTemplates.ts         # 内置示例模板
├─ stores/
│  └─ templateStore.ts           # 当前编辑模板的 Pinia store
├─ utils/
│  ├─ uid.ts
│  └─ describe.ts                # 规则 → 自然语言描述
├─ components/
│  ├─ designer/                  # 设计器
│  │  ├─ ComponentLibrary.vue    # 左侧组件库
│  │  ├─ DesignerCanvas.vue      # 中间画布
│  │  ├─ PropertyPanel.vue       # 右侧属性面板
│  │  ├─ FieldPreview.vue        # 画布字段预览
│  │  ├─ OptionEditor.vue        # 选项编辑
│  │  └─ rules/                  # 规则编辑器
│  │     ├─ RuleList.vue
│  │     ├─ RuleWizard.vue       # 4 步向导
│  │     ├─ ExpressionEditor.vue # 表达式编辑器（带插入字段+运算符）
│  │     ├─ CalculationRuleEditor.vue
│  │     ├─ ThresholdRuleEditor.vue
│  │     ├─ ComparisonRuleEditor.vue
│  │     ├─ ConditionalRuleEditor.vue
│  │     └─ ValidationRuleEditor.vue
│  └─ renderer/                  # 渲染器
│     ├─ FormRenderer.vue        # 主表单渲染器
│     └─ engine/
│        ├─ RuleEngine.ts        # 规则引擎
│        ├─ ExpressionEvaluator.ts  # 表达式求值器
│        └─ ActionApplier.ts     # 副作用应用器
├─ pages/
│  ├─ TemplateList.vue
│  ├─ Designer.vue
│  └─ Renderer.vue
├─ router/
│  └─ index.ts
└─ main.ts
```

## 5 种规则类型

| 规则类型   | 适用场景                            | 编辑方式                                                |
| ---------- | ----------------------------------- | ------------------------------------------------------- |
| `threshold` | 阈值分级（白细胞 < 4 偏低、4-10 正常） | 纯表单：填区间、标签、颜色                              |
| `calculation` | 计算规则（a + b / 2）             | 选预设模板 / 自定义表达式（带插入字段按钮）              |
| `comparison` | 比较（值 > 阈值时高亮）             | 三段式表单：字段下拉 + 操作符下拉 + 常量/字段            |
| `conditional` | 条件显隐（性别=女时显示X）         | 自然语言式表单：当 X 是 Y 时 显示/隐藏 Z                |
| `validation` | 必填、数值范围、正则                | 勾选式表单：勾选校验类型 + 填阈值 + 错误提示文案        |

## 关键设计点

1. **规则引擎核心在 `src/components/renderer/engine/`**，表达式解析器自研，支持 `+ - * / ( )` 和 `Math.max/min/abs/round/floor/ceil` 等。
2. **FormRenderer 维护受控的 fieldStates**，所有副作用（颜色/标签/显隐）通过 ActionApplier 写入中央状态，字段组件纯展示。
3. **JSON Schema 见 `src/types/template.ts`**，可直接传给后端持久化。
4. **示例模板见 `src/data/sampleTemplates.ts`**，覆盖了 5 种规则类型。

## 已知限制（原型的局限性）

- 规则编辑只支持**新增**，不支持编辑已存在的规则（M5 阶段延后）
- 模板没有版本管理（PRD 第 10 节 R-06 已识别）
- localStorage 容量限制（~5MB），演示足够
- antd vue3 的 a-menu @click 回调使用 `{ key }` 参数，需要保证 menu-item 有 key
- 8 种组件类型已实现，可扩展

## 与 PRD 的对应关系

| PRD 章节      | 实现位置                                         |
| ------------- | ------------------------------------------------ |
| 第 5 章 JSON Schema | `src/types/template.ts`                         |
| 第 5.5 节 5 种规则  | `src/components/renderer/engine/RuleEngine.ts`  |
| 第 6.1 模板列表     | `src/pages/TemplateList.vue`                    |
| 第 6.2 设计器       | `src/components/designer/*`                     |
| 第 6.3 渲染器       | `src/components/renderer/FormRenderer.vue`      |
| 第 12 章 非技术友好 | `src/components/designer/rules/*`               |