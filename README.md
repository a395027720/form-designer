# 检查报告动态表单设计器

基于 Vue 3 + Vite + Ant Design Vue 4 的单页应用，让运营/医务人员通过可视化设计器配置检查报告模板（JSON Schema），渲染器消费模板即可渲染录入页面，无需发版即可新增报告类型。

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:5173
```

首次访问会自动注入两个示例模板：**血常规检查报告**（含阈值分级、计算规则）和**肝功能检查报告**（含条件显隐、校验规则）。

## 三种设计模式

首页提供三个入口，覆盖不同使用场景：

| 模式 | 路由入口 | 适用场景 |
|------|----------|----------|
| **自由设计** (basic) | `/templates` → 新建 basic 模板 | 从 11 种组件库拖拽，自由搭建模板，支持排序、规则配置 |
| **字段拼装** (presets) | `/templates/new/presets` | 从已有字段库选取字段，快速拼装成模板 |
| **字段管理** (field) | `/fields` | 管理字段库中的小项目，定义标签、类型、校验规则等 |

三种模式均由 `FormDesigner` 组件（`mode` prop）统一驱动，Props/Emits 接口一致。

## 项目结构

```
src/
├── components/form-designer/       # 核心模块（设计器 + 渲染器）
│   ├── index.ts                    # 公开入口：导出组件、类型、工具函数、引擎
│   ├── types.ts                    # 统一类型（ComponentDef/FormTemplate/RuleDef 等）
│   ├── basicComponents.ts          # 11 种组件元数据 + 默认 props
│   ├── validate.ts                 # isValidComponentDef / validateTemplate
│   ├── FormDesigner.vue            # 三模式入口（basic/presets/field）
│   ├── FormRenderer.vue            # 运行时渲染器（消费模板 + RuleEngine）
│   ├── designer/                   # 设计器子组件
│   │   ├── BasicDesigner.vue       # basic 模式三栏布局
│   │   ├── PresetsDesigner.vue     # presets 模式三栏布局
│   │   ├── ComponentLibrary.vue    # 左侧：可拖拽组件库
│   │   ├── FieldLibrary.vue        # field 模式：点击切换组件类型
│   │   ├── PresetsLibrary.vue      # presets 模式：字段库列表
│   │   ├── CanvasItem.vue          # 画布卡片（排序/复制/删除）
│   │   ├── FieldPreview.vue        # 字段渲染预览
│   │   ├── PropertyPanel.vue       # 右侧属性面板（a-tabs：基础/校验/业务规则）
│   │   ├── OptionsEditor.vue       # Select/Radio/Checkbox 选项编辑器
│   │   ├── stores/designerStore.ts # 纯模块函数（generateTempId / ensureTempIds）
│   │   └── rules/                  # 规则编辑器
│   │       ├── RuleList.vue        # 规则列表
│   │       ├── RuleWizard.vue      # 4 步向导（选择类型 → 配置触发 → 编辑参数 → 预览）
│   │       ├── ExpressionEditor.vue # 表达式编辑器（插入字段 + 运算符按钮）
│   │       ├── CalculationRuleEditor.vue
│   │       ├── ThresholdRuleEditor.vue
│   │       ├── ComparisonRuleEditor.vue
│   │       ├── ConditionalRuleEditor.vue
│   │       └── ValidationRuleEditor.vue
│   ├── runtime/                    # 渲染引擎
│   │   ├── RuleEngine.ts           # 规则引擎（值变化分发 + 求值 + 副作用收集）
│   │   ├── ExpressionEvaluator.ts  # 自研递归下降表达式解析器
│   │   └── ActionApplier.ts        # 副作用写入集中式 FieldState
│   └── utils/                      # 工具函数
│       ├── uid.ts                  # 唯一 ID 生成
│       ├── describe.ts             # 规则 → 自然语言描述
│       └── componentIO.ts          # 后端接口数据 ↔ ComponentDef 双向转换工具集
├── views/                          # 页面
│   ├── HomePage.vue                # 首页三入口
│   ├── field/
│   │   ├── FieldList.vue           # 字段列表
│   │   └── FieldEditor.vue         # 字段编辑（field 模式 FormDesigner）
│   └── template/
│       ├── TemplateList.vue        # 模板列表
│       ├── BasicEditor.vue         # basic 模式编辑器
│       ├── PresetsEditor.vue       # presets 模式编辑器
│       └── TemplateRenderer.vue    # 模板渲染/预览
├── api/templateApi.ts              # localStorage 持久化封装（CRUD + 导出导入）
├── data/
│   ├── sampleTemplates.ts          # 内置示例模板（血常规、肝功能）
│   └── indicatorData.ts            # presets 模式假数据（15 个血液检查字段）
├── types/antd-mapping.ts           # 组件库元数据
├── router/index.ts                 # 路由配置（9 条路由）
├── styles/global.css               # 全局样式
└── main.ts                         # 入口（Vue + Router + Antd）
```

## 11 种组件类型

| 类型 | 说明 | 特有配置 |
|------|------|----------|
| `Input` | 文本输入框 | placeholder |
| `Textarea` | 多行文本 | rows |
| `InputNumber` | 数字输入 | min/max/step/precision |
| `Select` | 下拉选择 | options / api |
| `RadioGroup` | 单选组 | options |
| `CheckboxGroup` | 多选组 | options |
| `DatePicker` | 日期选择 | format |
| `TimePicker` | 时间选择 | format |
| `Switch` | 开关 | checkedChildren / unCheckedChildren |
| `DisplayText` | 展示文本 | 纯展示，无输入 |
| `Upload` | 文件上传 | accept / maxCount / listType / maxSize |

## 5 种规则类型

| 规则类型 | 适用场景 | 编辑方式 |
|----------|----------|----------|
| `calculation` | 计算规则（如 BMI = 体重 / 身高²） | 选预设模板 / 自定义表达式（带插入字段按钮） |
| `threshold` | 阈值分级（如白细胞 < 4 偏低、4-10 正常） | 纯表单：填区间、标签、颜色 |
| `comparison` | 比较（如值 > 阈值时高亮） | 三段式：字段下拉 + 操作符下拉 + 常量/字段 |
| `conditional` | 条件显隐（如性别=女时显示 X） | 自然语言式：当 X 是 Y 时 显示/隐藏 Z |
| `validation` | 必填、数值范围、正则 | 勾选式：勾选校验类型 + 填阈值 + 错误提示 |

## IO 工具集（componentIO）

`src/components/form-designer/utils/componentIO.ts` 提供 5 个纯函数，处理 **后端接口数据 ↔ ComponentDef** 双向转换：

| 函数 | 方向 | 用途 |
|------|------|------|
| `parseComponentJson(json)` | 接口 → 前端 | 解析后端 JSON 字符串为 ComponentDef |
| `injectProps(def, source, mapping)` | 接口 → 前端 | 按 mapping 把后端平铺字段注入 props |
| `serializeComponentJson(def)` | 前端 → 接口 | ComponentDef 序列化为 JSON 字符串 |
| `extractProps(def, mapping)` | 前端 → 接口 | injectProps 反向：props → 平铺字段 |
| `serializeRuleExpress(rules)` | 前端 → 接口 | 规则列表序列化（过滤禁用规则，去前端字段） |

## 关键设计决策

1. **无状态管理库**：不使用 Pinia，状态管理走 module-singleton ref + composable 模式（`useFields()`），组件间通信走 Props/Emits 单向数据流
2. **表达式解析器自研**：`ExpressionEvaluator` 是手写递归下降解析器（词法 → AST → 求值），支持 `+ - * / ( )` 和 `Math.max/min/abs/round/floor/ceil`，不引入第三方数学库
3. **集中式副作用管理**：FormRenderer 维护 `states: Record<string, FieldState>`，ActionApplier 通过 `setFieldState` 回调写入，字段组件纯展示
4. **计算字段保护**：autoCalculated 标记防止用户手动覆盖计算结果
5. **持久化走 localStorage**：key 为 `check-report-templates`，`templateApi` 提供 CRUD + 导入导出 JSON
6. **右侧面板可拖拽调整**：默认 340px，范围 280-560px

## 已知限制

- 规则编辑只支持**新增**，不支持编辑已存在的规则
- 模板没有版本管理
- localStorage 容量限制（~5MB），演示足够
- 空画布拖拽首个组件偶尔不生效，双击添加作为兜底
- 无自动化测试（原型阶段）
