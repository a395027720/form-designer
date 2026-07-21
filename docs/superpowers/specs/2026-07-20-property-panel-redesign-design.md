# 属性面板样式美化 — 设计文档

日期：2026-07-20
范围：仅 `src/components/designer/PropertyPanel.vue` 的样式（template 与 script 不变）

## 目标

把 `PropertyPanel` 从 antd 默认的 `size="small"` 密集布局，重构为「分组卡片化」视觉风格，参考 Figma 右侧属性面板。保持现有信息架构（3 个 tab × 卡片内分组），主色用 antd 默认蓝 `#1677ff`。

## 设计决策

| 维度 | 决策 |
| --- | --- |
| 风格 | 分组卡片化（Figma 风格） |
| 信息架构 | 保留 3 个 tab（基础 / 校验 / 业务规则），tab 内分组 |
| 主色 | antd 默认蓝 `#1677ff` |
| 卡片背景 | 白 `#ffffff` |
| 卡片边框 | `1px solid #e5e7eb` |
| 卡片圆角 | `8px` |
| 卡片内边距 | `16px` |
| 卡片间距 | `12px` |
| 卡片标题 | 左上 12px 蓝底蓝字 chip（背景 `#f0f5ff`、文字 `#1677ff`、6px 圆角、内边距 2px 8px） |
| form-item 标签 | 12px 灰 `#6b7280` |
| form-item 控件 | 全宽 |
| form-item 间距 | 14px（用 `gap` 控制而非 margin） |
| tab 激活态 | 底部 2px 蓝条 + 文字加粗 |
| 滚动条 | antd 默认 |

## 分组定义

### 基础 tab（选中组件时）

| 卡片 | 包含字段 |
| --- | --- |
| 标签与字段 | 标签 (label)、字段名 (field)、单位、默认值 |
| 外观 | 宽度（24 栅格）、输入框宽度、标签占比 |
| 校验 | 必填、容器属性（卡片 / 折叠面板的私有属性） |

### 表单设置（未选中组件时）

| 卡片 | 包含字段 |
| --- | --- |
| 布局 | 布局方向、默认标签占比、默认组件宽度 |
| 占位提示 | 原有 `<a-empty description="选中一个组件开始编辑" />` |

### 校验 / 业务规则 tab

`RuleList` 内部结构不动（已独立），不强制卡片化；保持现有滚动行为。

## 改动清单

| 文件 | 变更 |
| --- | --- |
| `src/components/designer/PropertyPanel.vue` | 重写 `<style scoped>`；模板增加卡片容器 `<div class="pp-card">` 包裹每组 form-item；卡片标题用 `<div class="pp-card-title">` 包裹 |

不动：
- 任何模板外的 `.ts` / 业务逻辑
- `OptionEditor` / `RuleList` / `FieldPreview` 组件
- 渲染器（`Renderer.vue`）

## 设计 token（CSS 变量复用 antd 主题）

```css
:root {
  --pp-card-bg: #ffffff;
  --pp-card-border: #e5e7eb;
  --pp-card-radius: 8px;
  --pp-card-padding: 16px;
  --pp-card-gap: 12px;
  --pp-card-title-bg: #f0f5ff;
  --pp-card-title-color: #1677ff;
  --pp-label-color: #6b7280;
  --pp-item-gap: 14px;
  --pp-primary: #1677ff;
}
```

## 验收

- 选中组件：右侧面板出现「标签与字段」「外观」「校验」3 张卡片，每张卡片白底+边框+圆角+内边距
- 未选中组件：「布局」卡片 + 「占位提示」区域
- tab 切换流畅，无视觉跳动
- 原有交互 100% 保留（slider / input / switch / checkbox / 校验规则编辑 等）
- 不引入新依赖，不动其他文件

## 风险

- `<a-tabs>` 默认会跟外层 `flex: 1` 撑满，卡片化后内部滚动条位置不变，行为一致
- `:deep(.ant-tabs)` 选择器可能与新版 antd 内部结构耦合；改动后回归视觉
