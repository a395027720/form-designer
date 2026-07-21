# 自实现 UI 组件库 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 `src/sdk/internal/ui/` 下实现 10 个 antd 风格的 Vue 3 组件，作为 SDK 的内部 UI 模块（设计器工具 UI + 渲染器业务字段 UI 共用）。

**架构：** 每个组件是一个独立的 .vue 单文件组件，样式模仿 antd 4 视觉风格（颜色、间距、圆角），props API 与 antd 对齐。统一从 `index.ts` 导出。

**技术栈：** Vue 3.5 + TypeScript 5.6 + Vitest + @vue/test-utils + jsdom

**依赖关系：** 此计划是计划 B（SDK 重构）的前置，但可以**独立产出可工作的 UI 库**。

---

## 文件结构

要创建的文件：

| 路径 | 职责 |
|---|---|
| `src/sdk/internal/ui/Input.vue` | 单行文本 |
| `src/sdk/internal/ui/Textarea.vue` | 多行文本 |
| `src/sdk/internal/ui/InputNumber.vue` | 数字输入 |
| `src/sdk/internal/ui/Select.vue` | 下拉选择 |
| `src/sdk/internal/ui/RadioGroup.vue` | 单选组 |
| `src/sdk/internal/ui/CheckboxGroup.vue` | 多选组 |
| `src/sdk/internal/ui/DatePicker.vue` | 日期选择 |
| `src/sdk/internal/ui/TimePicker.vue` | 时间选择 |
| `src/sdk/internal/ui/Switch.vue` | 开关 |
| `src/sdk/internal/ui/DisplayText.vue` | 只读展示 |
| `src/sdk/internal/ui/styles.css` | 模仿 antd 视觉的全局样式（颜色变量 + 基础类） |
| `src/sdk/internal/ui/index.ts` | 统一导出 |
| `src/sdk/internal/ui/__tests__/*.spec.ts` | 10 个组件单测 |
| `vitest.config.ts` | Vitest 配置 |
| `src/sdk/internal/ui/__tests__/setup.ts` | 测试环境配置（jsdom 引入 styles.css） |

要修改的文件：

| 路径 | 改动 |
|---|---|
| `package.json` | 加 devDependencies: `vitest`, `@vue/test-utils`, `jsdom`；加 script: `test` |
| `.gitignore` | 加 `coverage/` |

---

## 任务 1：环境准备

**文件：**
- 修改：`package.json`
- 创建：`vitest.config.ts`
- 创建：`src/sdk/internal/ui/__tests__/setup.ts`
- 创建：`src/sdk/internal/ui/__tests__/smoke.spec.ts`（临时，验证环境 OK 后删除）

- [ ] **步骤 1：安装依赖**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
npm install -D vitest@^1.6.0 @vue/test-utils@^2.4.6 jsdom@^25.0.0
```

- [ ] **步骤 2：在 package.json 加 test script**

修改 `package.json` 的 `scripts` 段：

```json
"scripts": {
  "dev": "vite",
  "build": "vue-tsc -b && vite build",
  "build:sdk": "vue-tsc -b && vite build --mode lib",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **步骤 3：创建 vitest.config.ts**

文件：`vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/sdk/internal/ui/__tests__/setup.ts'],
    include: ['src/**/__tests__/**/*.spec.ts'],
    css: true
  }
})
```

- [ ] **步骤 4：创建测试 setup 文件**

文件：`src/sdk/internal/ui/__tests__/setup.ts`

```ts
// 引入全局样式 + 模拟 antd 视觉
import '../styles.css'
```

- [ ] **步骤 5：创建临时 smoke test 验证环境**

文件：`src/sdk/internal/ui/__tests__/smoke.spec.ts`

```ts
import { describe, it, expect } from 'vitest'

describe('vitest env', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **步骤 6：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test
```

预期：1 个 test 通过。

- [ ] **步骤 7：删除 smoke.spec.ts**

```bash
rm "/Users/gaojianqiang/Desktop/claude workspace/form-designer/src/sdk/internal/ui/__tests__/smoke.spec.ts"
```

- [ ] **步骤 8：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add package.json vitest.config.ts src/sdk/internal/ui/__tests__/setup.ts
git commit -m "test: setup vitest + @vue/test-utils for SDK UI library"
```

---

## 任务 2：全局样式（antd 视觉 token）

**文件：**
- 创建：`src/sdk/internal/ui/styles.css`

- [ ] **步骤 1：写 styles.css**

文件：`src/sdk/internal/ui/styles.css`

```css
/* 模仿 antd 4 视觉风格的全局样式 token */

:root {
  /* 主题色 */
  --color-primary: #1890ff;
  --color-primary-hover: #40a9ff;
  --color-primary-active: #096dd9;
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-error: #ff4d4f;

  /* 中性色 */
  --color-text: rgba(0, 0, 0, 0.85);
  --color-text-secondary: rgba(0, 0, 0, 0.65);
  --color-text-disabled: rgba(0, 0, 0, 0.25);
  --color-text-placeholder: rgba(0, 0, 0, 0.25);

  --color-border: #d9d9d9;
  --color-border-hover: #40a9ff;
  --color-bg: #ffffff;
  --color-bg-hover: #f5f5f5;
  --color-bg-disabled: #f5f5f5;

  /* 尺寸 */
  --height-base: 32px;
  --height-lg: 40px;
  --height-sm: 24px;
  --radius: 2px;
  --padding-x: 11px;
  --font-size: 14px;

  /* 间距 */
  --gap-sm: 4px;
  --gap-md: 8px;
  --gap-lg: 16px;
}

/* 基础输入框样式（被各组件复用） */
.fd-input {
  box-sizing: border-box;
  margin: 0;
  padding: 0 var(--padding-x);
  font-size: var(--font-size);
  line-height: 1.5715;
  color: var(--color-text);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  width: 100%;
  height: var(--height-base);
  transition: all 0.3s;
  outline: none;
}

.fd-input:hover:not(:disabled) {
  border-color: var(--color-border-hover);
}

.fd-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.fd-input:disabled {
  color: var(--color-text-disabled);
  background-color: var(--color-bg-disabled);
  cursor: not-allowed;
}

.fd-input::placeholder {
  color: var(--color-text-placeholder);
}
```

- [ ] **步骤 2：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/styles.css
git commit -m "feat(ui): add antd-style global styles tokens"
```

---

## 任务 3：实现 Input 组件

**文件：**
- 创建：`src/sdk/internal/ui/Input.vue`
- 创建：`src/sdk/internal/ui/__tests__/Input.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/Input.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from '../Input.vue'

describe('Input', () => {
  it('renders with placeholder', () => {
    const wrapper = mount(Input, { props: { placeholder: '请输入' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(Input, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello'])
  })

  it('respects maxLength', () => {
    const wrapper = mount(Input, { props: { maxLength: 10 } })
    expect(wrapper.find('input').attributes('maxlength')).toBe('10')
  })

  it('respects disabled', () => {
    const wrapper = mount(Input, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Input
```

预期：FAIL — Input.vue 不存在。

- [ ] **步骤 3：实现 Input.vue**

文件：`src/sdk/internal/ui/Input.vue`

```vue
<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  maxLength?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    class="fd-input"
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxLength"
    @input="onInput"
  />
</template>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Input
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/Input.vue src/sdk/internal/ui/__tests__/Input.spec.ts
git commit -m "feat(ui): add Input component with tests"
```

---

## 任务 4：实现 Textarea 组件

**文件：**
- 创建：`src/sdk/internal/ui/Textarea.vue`
- 创建：`src/sdk/internal/ui/__tests__/Textarea.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/Textarea.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Textarea from '../Textarea.vue'

describe('Textarea', () => {
  it('renders as textarea element', () => {
    const wrapper = mount(Textarea, { props: { modelValue: '' } })
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(Textarea, { props: { modelValue: '' } })
    await wrapper.find('textarea').setValue('multi\nline')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['multi\nline'])
  })

  it('respects rows', () => {
    const wrapper = mount(Textarea, { props: { rows: 5 } })
    expect(wrapper.find('textarea').attributes('rows')).toBe('5')
  })

  it('respects maxLength', () => {
    const wrapper = mount(Textarea, { props: { maxLength: 100 } })
    expect(wrapper.find('textarea').attributes('maxlength')).toBe('100')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Textarea
```

预期：FAIL — Textarea.vue 不存在。

- [ ] **步骤 3：实现 Textarea.vue**

文件：`src/sdk/internal/ui/Textarea.vue`

```vue
<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    class="fd-input fd-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxLength"
    :rows="rows ?? 4"
    @input="onInput"
  />
</template>

<style scoped>
.fd-textarea {
  height: auto;
  padding: 4px 11px;
  resize: vertical;
  min-height: 32px;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Textarea
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/Textarea.vue src/sdk/internal/ui/__tests__/Textarea.spec.ts
git commit -m "feat(ui): add Textarea component with tests"
```

---

## 任务 5：实现 InputNumber 组件

**文件：**
- 创建：`src/sdk/internal/ui/InputNumber.vue`
- 创建：`src/sdk/internal/ui/__tests__/InputNumber.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/InputNumber.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InputNumber from '../InputNumber.vue'

describe('InputNumber', () => {
  it('renders numeric input', () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 0 } })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('number')
  })

  it('emits number type on input', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 0 } })
    await wrapper.find('input').setValue('42')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([42])
  })

  it('emits null when cleared', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 10 } })
    await wrapper.find('input').setValue('')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('respects min and max', () => {
    const wrapper = mount(InputNumber, { props: { min: 0, max: 100 } })
    const input = wrapper.find('input')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('100')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- InputNumber
```

预期：FAIL — InputNumber.vue 不存在。

- [ ] **步骤 3：实现 InputNumber.vue**

文件：`src/sdk/internal/ui/InputNumber.vue`

```vue
<script setup lang="ts">
interface Props {
  modelValue?: number | null
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', Number(raw))
  }
}
</script>

<template>
  <input
    class="fd-input"
    type="number"
    :value="modelValue ?? ''"
    :placeholder="placeholder"
    :disabled="disabled"
    :min="min"
    :max="max"
    :step="step ?? 1"
    @input="onInput"
  />
</template>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- InputNumber
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/InputNumber.vue src/sdk/internal/ui/__tests__/InputNumber.spec.ts
git commit -m "feat(ui): add InputNumber component with tests"
```

---

## 任务 6：实现 Select 组件

**文件：**
- 创建：`src/sdk/internal/ui/Select.vue`
- 创建：`src/sdk/internal/ui/__tests__/Select.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/Select.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from '../Select.vue'

interface Option {
  label: string
  value: string
}

describe('Select', () => {
  const options: Option[] = [
    { label: '选项 A', value: 'a' },
    { label: '选项 B', value: 'b' }
  ]

  it('renders all options', () => {
    const wrapper = mount(Select, {
      props: { modelValue: '', options }
    })
    const html = wrapper.html()
    expect(html).toContain('选项 A')
    expect(html).toContain('选项 B')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(Select, {
      props: { modelValue: '', options }
    })
    await wrapper.find('select').setValue('b')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('respects disabled', () => {
    const wrapper = mount(Select, {
      props: { modelValue: '', options, disabled: true }
    })
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('respects placeholder', () => {
    const wrapper = mount(Select, {
      props: { modelValue: '', options, placeholder: '请选择' }
    })
    const firstOption = wrapper.find('option')
    expect(firstOption.text()).toBe('请选择')
    expect(firstOption.attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Select
```

预期：FAIL — Select.vue 不存在。

- [ ] **步骤 3：实现 Select.vue**

文件：`src/sdk/internal/ui/Select.vue`

```vue
<script setup lang="ts" generic="T extends string | number">
interface Option {
  label: string
  value: T
}

interface Props {
  modelValue?: T
  options: Option[]
  placeholder?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

function onChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  // 数字类型还原
  const opt = props.options.find(o => String(o.value) === raw)
  if (opt) emit('update:modelValue', opt.value)
}
</script>

<template>
  <select
    class="fd-input fd-select"
    :value="modelValue"
    :disabled="disabled"
    @change="onChange"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>

<style scoped>
.fd-select {
  cursor: pointer;
  appearance: none;
  padding-right: 28px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='%23999'><path d='M6 8L0 0h12z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 11px center;
  background-size: 12px 8px;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Select
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/Select.vue src/sdk/internal/ui/__tests__/Select.spec.ts
git commit -m "feat(ui): add Select component with tests"
```

---

## 任务 7：实现 RadioGroup 组件

**文件：**
- 创建：`src/sdk/internal/ui/RadioGroup.vue`
- 创建：`src/sdk/internal/ui/__tests__/RadioGroup.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/RadioGroup.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RadioGroup from '../RadioGroup.vue'

interface Option {
  label: string
  value: string
}

describe('RadioGroup', () => {
  const options: Option[] = [
    { label: '男', value: 'male' },
    { label: '女', value: 'female' }
  ]

  it('renders all radio options', () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: '', options }
    })
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios.length).toBe(2)
  })

  it('emits update:modelValue on select', async () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: '', options }
    })
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1].setValue()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['female'])
  })

  it('marks selected option as checked', () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: 'female', options }
    })
    const radios = wrapper.findAll('input[type="radio"]')
    expect((radios[0].element as HTMLInputElement).checked).toBe(false)
    expect((radios[1].element as HTMLInputElement).checked).toBe(true)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- RadioGroup
```

预期：FAIL — RadioGroup.vue 不存在。

- [ ] **步骤 3：实现 RadioGroup.vue**

文件：`src/sdk/internal/ui/RadioGroup.vue`

```vue
<script setup lang="ts" generic="T extends string | number">
interface Option {
  label: string
  value: T
}

interface Props {
  modelValue?: T
  options: Option[]
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

function onChange(value: T) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="fd-radio-group">
    <label
      v-for="opt in options"
      :key="String(opt.value)"
      class="fd-radio"
      :class="{ 'fd-radio-checked': modelValue === opt.value, 'fd-radio-disabled': disabled }"
    >
      <input
        type="radio"
        :value="opt.value"
        :checked="modelValue === opt.value"
        :disabled="disabled"
        @change="onChange(opt.value)"
      />
      <span>{{ opt.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.fd-radio-group {
  display: inline-flex;
  gap: var(--gap-lg);
}
.fd-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-sm);
  cursor: pointer;
  color: var(--color-text);
}
.fd-radio input {
  margin: 0;
  cursor: pointer;
  accent-color: var(--color-primary);
}
.fd-radio-disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- RadioGroup
```

预期：3 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/RadioGroup.vue src/sdk/internal/ui/__tests__/RadioGroup.spec.ts
git commit -m "feat(ui): add RadioGroup component with tests"
```

---

## 任务 8：实现 CheckboxGroup 组件

**文件：**
- 创建：`src/sdk/internal/ui/CheckboxGroup.vue`
- 创建：`src/sdk/internal/ui/__tests__/CheckboxGroup.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/CheckboxGroup.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CheckboxGroup from '../CheckboxGroup.vue'

interface Option {
  label: string
  value: string
}

describe('CheckboxGroup', () => {
  const options: Option[] = [
    { label: '苹果', value: 'apple' },
    { label: '香蕉', value: 'banana' },
    { label: '樱桃', value: 'cherry' }
  ]

  it('renders all checkboxes', () => {
    const wrapper = mount(CheckboxGroup, {
      props: { modelValue: [], options }
    })
    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect(boxes.length).toBe(3)
  })

  it('emits update:modelValue with array on toggle', async () => {
    const wrapper = mount(CheckboxGroup, {
      props: { modelValue: [], options }
    })
    const boxes = wrapper.findAll('input[type="checkbox"]')
    await boxes[0].setValue()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['apple']])
  })

  it('marks checked options', () => {
    const wrapper = mount(CheckboxGroup, {
      props: { modelValue: ['banana'], options }
    })
    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect((boxes[0].element as HTMLInputElement).checked).toBe(false)
    expect((boxes[1].element as HTMLInputElement).checked).toBe(true)
    expect((boxes[2].element as HTMLInputElement).checked).toBe(false)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- CheckboxGroup
```

预期：FAIL — CheckboxGroup.vue 不存在。

- [ ] **步骤 3：实现 CheckboxGroup.vue**

文件：`src/sdk/internal/ui/CheckboxGroup.vue`

```vue
<script setup lang="ts" generic="T extends string | number">
interface Option {
  label: string
  value: T
}

interface Props {
  modelValue?: T[]
  options: Option[]
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: T[]): void
}>()

function toggle(value: T, checked: boolean) {
  const current = props.modelValue ?? []
  if (checked) {
    if (!current.includes(value)) {
      emit('update:modelValue', [...current, value])
    }
  } else {
    emit('update:modelValue', current.filter(v => v !== value))
  }
}

function isChecked(value: T): boolean {
  return (props.modelValue ?? []).includes(value)
}
</script>

<template>
  <div class="fd-checkbox-group">
    <label
      v-for="opt in options"
      :key="String(opt.value)"
      class="fd-checkbox"
      :class="{ 'fd-checkbox-disabled': disabled }"
    >
      <input
        type="checkbox"
        :checked="isChecked(opt.value)"
        :disabled="disabled"
        @change="(e) => toggle(opt.value, (e.target as HTMLInputElement).checked)"
      />
      <span>{{ opt.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.fd-checkbox-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--gap-lg);
}
.fd-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-sm);
  cursor: pointer;
  color: var(--color-text);
}
.fd-checkbox input {
  margin: 0;
  cursor: pointer;
  accent-color: var(--color-primary);
}
.fd-checkbox-disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- CheckboxGroup
```

预期：3 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/CheckboxGroup.vue src/sdk/internal/ui/__tests__/CheckboxGroup.spec.ts
git commit -m "feat(ui): add CheckboxGroup component with tests"
```

---

## 任务 9：实现 DatePicker 组件

**文件：**
- 创建：`src/sdk/internal/ui/DatePicker.vue`
- 创建：`src/sdk/internal/ui/__tests__/DatePicker.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/DatePicker.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DatePicker from '../DatePicker.vue'

describe('DatePicker', () => {
  it('renders date input', () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '' } })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('date')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('2026-07-21')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2026-07-21'])
  })

  it('respects disabled', () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '', disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- DatePicker
```

预期：FAIL — DatePicker.vue 不存在。

- [ ] **步骤 3：实现 DatePicker.vue**

文件：`src/sdk/internal/ui/DatePicker.vue`

```vue
<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    class="fd-input fd-datepicker"
    type="date"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="onInput"
  />
</template>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- DatePicker
```

预期：3 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/DatePicker.vue src/sdk/internal/ui/__tests__/DatePicker.spec.ts
git commit -m "feat(ui): add DatePicker component with tests"
```

---

## 任务 10：实现 TimePicker 组件

**文件：**
- 创建：`src/sdk/internal/ui/TimePicker.vue`
- 创建：`src/sdk/internal/ui/__tests__/TimePicker.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/TimePicker.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimePicker from '../TimePicker.vue'

describe('TimePicker', () => {
  it('renders time input', () => {
    const wrapper = mount(TimePicker, { props: { modelValue: '' } })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('time')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(TimePicker, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('10:30')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['10:30'])
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TimePicker
```

预期：FAIL — TimePicker.vue 不存在。

- [ ] **步骤 3：实现 TimePicker.vue**

文件：`src/sdk/internal/ui/TimePicker.vue`

```vue
<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    class="fd-input fd-timepicker"
    type="time"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="onInput"
  />
</template>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TimePicker
```

预期：2 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/TimePicker.vue src/sdk/internal/ui/__tests__/TimePicker.spec.ts
git commit -m "feat(ui): add TimePicker component with tests"
```

---

## 任务 11：实现 Switch 组件

**文件：**
- 创建：`src/sdk/internal/ui/Switch.vue`
- 创建：`src/sdk/internal/ui/__tests__/Switch.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/Switch.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Switch from '../Switch.vue'

describe('Switch', () => {
  it('renders as checkbox', () => {
    const wrapper = mount(Switch, { props: { modelValue: false } })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('checkbox')
  })

  it('emits update:modelValue true when toggled on', async () => {
    const wrapper = mount(Switch, { props: { modelValue: false } })
    await wrapper.find('input').setValue()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('emits update:modelValue false when toggled off', async () => {
    const wrapper = mount(Switch, { props: { modelValue: true } })
    const input = wrapper.find('input')
    await input.trigger('change')  // 取消选中
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Switch
```

预期：FAIL — Switch.vue 不存在。

- [ ] **步骤 3：实现 Switch.vue**

文件：`src/sdk/internal/ui/Switch.vue`

```vue
<script setup lang="ts">
interface Props {
  modelValue?: boolean
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <label class="fd-switch" :class="{ 'fd-switch-checked': modelValue, 'fd-switch-disabled': disabled }">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="fd-switch-handle"></span>
  </label>
</template>

<style scoped>
.fd-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 11px;
  cursor: pointer;
  transition: background 0.3s;
}
.fd-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.fd-switch-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: left 0.3s;
}
.fd-switch-checked {
  background: var(--color-primary);
}
.fd-switch-checked .fd-switch-handle {
  left: 24px;
}
.fd-switch-disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- Switch
```

预期：3 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/Switch.vue src/sdk/internal/ui/__tests__/Switch.spec.ts
git commit -m "feat(ui): add Switch component with tests"
```

---

## 任务 12：实现 DisplayText 组件

**文件：**
- 创建：`src/sdk/internal/ui/DisplayText.vue`
- 创建：`src/sdk/internal/ui/__tests__/DisplayText.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/DisplayText.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DisplayText from '../DisplayText.vue'

describe('DisplayText', () => {
  it('renders text content', () => {
    const wrapper = mount(DisplayText, {
      props: { modelValue: '显示文本' }
    })
    expect(wrapper.text()).toBe('显示文本')
  })

  it('updates when modelValue changes', async () => {
    const wrapper = mount(DisplayText, {
      props: { modelValue: 'old' }
    })
    await wrapper.setProps({ modelValue: 'new' })
    expect(wrapper.text()).toBe('new')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- DisplayText
```

预期：FAIL — DisplayText.vue 不存在。

- [ ] **步骤 3：实现 DisplayText.vue**

文件：`src/sdk/internal/ui/DisplayText.vue`

```vue
<script setup lang="ts">
interface Props {
  modelValue?: string
}

defineProps<Props>()
</script>

<template>
  <span class="fd-display-text">{{ modelValue }}</span>
</template>

<style scoped>
.fd-display-text {
  color: var(--color-text);
  font-size: var(--font-size);
  line-height: 1.5715;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- DisplayText
```

预期：2 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/DisplayText.vue src/sdk/internal/ui/__tests__/DisplayText.spec.ts
git commit -m "feat(ui): add DisplayText component with tests"
```

---

## 任务 13：统一导出 + 索引测试

**文件：**
- 创建：`src/sdk/internal/ui/index.ts`
- 创建：`src/sdk/internal/ui/__tests__/index.spec.ts`

- [ ] **步骤 1：写失败的测试**

文件：`src/sdk/internal/ui/__tests__/index.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import * as UI from '../index'

describe('UI module exports', () => {
  it('exports all 10 components', () => {
    expect(UI.Input).toBeDefined()
    expect(UI.Textarea).toBeDefined()
    expect(UI.InputNumber).toBeDefined()
    expect(UI.Select).toBeDefined()
    expect(UI.RadioGroup).toBeDefined()
    expect(UI.CheckboxGroup).toBeDefined()
    expect(UI.DatePicker).toBeDefined()
    expect(UI.TimePicker).toBeDefined()
    expect(UI.Switch).toBeDefined()
    expect(UI.DisplayText).toBeDefined()
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- index
```

预期：FAIL — index.ts 不存在。

- [ ] **步骤 3：写 index.ts**

文件：`src/sdk/internal/ui/index.ts`

```ts
export { default as Input } from './Input.vue'
export { default as Textarea } from './Textarea.vue'
export { default as InputNumber } from './InputNumber.vue'
export { default as Select } from './Select.vue'
export { default as RadioGroup } from './RadioGroup.vue'
export { default as CheckboxGroup } from './CheckboxGroup.vue'
export { default as DatePicker } from './DatePicker.vue'
export { default as TimePicker } from './TimePicker.vue'
export { default as Switch } from './Switch.vue'
export { default as DisplayText } from './DisplayText.vue'
```

- [ ] **步骤 4：跑全部测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test
```

预期：所有测试通过（任务 3-12 + 13）。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/sdk/internal/ui/index.ts src/sdk/internal/ui/__tests__/index.spec.ts
git commit -m "feat(ui): add index.ts exporting all 10 components"
```

---

## 自检

- [x] **规格覆盖度**：
  - §3.4 自实现 UI 组件库 → 任务 3-12 实现了 10 种组件
  - §3.4 视觉模仿 antd → 任务 2 的 styles.css + 各组件 scoped 样式
  - §3.4 设计器工具 UI 用 → 任务 13 的 index 导出，SDK 内部直接 import
  - §3.4 渲染器业务字段 UI 用 → 任务 13 的 index 导出，FormRenderer 内部用
  - §3.4 不再需要 antd → 任务 1 的 package.json 不加 antd peerDep

- [x] **占位符扫描**：
  - 全部代码块完整，无 "TODO" / "待定" / "类似任务"
  - 测试断言明确（expect 给出具体值）
  - 文件路径精确

- [x] **类型一致性**：
  - `modelValue` / `update:modelValue` 事件签名在所有组件中一致
  - `disabled` / `placeholder` / `maxLength` 在多组件中类型一致
  - `options: Option[]` 在 Select / RadioGroup / CheckboxGroup 一致
  - Switch 用 boolean，Input/Textarea/DatePicker/TimePicker/DisplayText 用 string，InputNumber 用 number|null

## 执行交接

**计划已完成并保存到 `docs/superpowers/plans/2026-07-21-ui-library.md`**。

两种执行方式：

1. **子代理驱动（推荐）** — 每个任务调度一个新的子代理，任务间进行审查，快速迭代
2. **内联执行** — 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

**选哪种方式？**
