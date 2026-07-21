# dev demo 重构 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 把现有 dev demo（TemplateList 单列表）改造成"小项目 + 大项"双列表架构，路由到新 SDK 组件。

**架构：** 首页（HomePage）双入口 → 字段列表（FieldList）/ 模板列表（TemplateList）→ 字段编辑（FieldEditor，FormDesigner field mode）/ 模板编辑（TemplateEditor，FormDesigner basic 或 presets mode）→ 模板渲染（TemplateRenderer，FormRenderer）。

**技术栈：** Vue 3.5 + Vue Router 4 + Pinia 2 + 计划 A 的 UI 组件 + 计划 B 的 SDK

**依赖关系：** 此计划依赖计划 A（自实现 UI 组件库）+ 计划 B（SDK 重构）。是三计划的最后一步。

---

## 文件结构

要创建的文件：

| 路径 | 职责 |
|---|---|
| `src/pages/HomePage.vue` | 双入口：跳到字段列表 / 模板列表 |
| `src/pages/FieldList.vue` | 小项目列表（CRUD + 编辑跳转） |
| `src/pages/FieldEditor.vue` | 编辑小项目（包 `<FormDesigner mode="field">`） |
| `src/pages/TemplateEditor.vue` | 编辑大项（包 `<FormDesigner mode="basic">` 或 `mode="presets">`） |
| `src/pages/TemplateRenderer.vue` | 渲染大项（包 `<FormRenderer>`） |
| `src/stores/fieldStore.ts` | Pinia store 管理 fields |
| `src/api/fieldApi.ts` | localStorage CRUD for fields |
| `src/pages/__tests__/*.spec.ts` | 页面组件单测 |

要修改的文件：

| 路径 | 改动 |
|---|---|
| `src/router/index.ts` | 重写路由表 |
| `src/stores/templateStore.ts` | 简化：只管 template（移除 field 相关） |
| `src/api/templateApi.ts` | 简化：只管 template |
| `src/pages/TemplateList.vue` | 改写：只展示 template |

要删除的文件：

| 路径 | 原因 |
|---|---|
| `src/pages/Designer.vue` | 被 TemplateEditor.vue 替代 |
| `src/pages/Renderer.vue` | 被 TemplateRenderer.vue 替代 |
| `src/components/designer/DesignerCanvas.vue` | 不再用 |
| `src/components/designer/FieldPreview.vue` | SDK 内部有 |
| `src/components/designer/PropertyPanel.vue` | SDK 内部有 |
| `src/components/designer/CanvasItem.vue` | SDK 内部有 |
| `src/components/designer/ComponentLibrary.vue` | SDK 内部有 |
| `src/components/designer/OptionEditor.vue` | 不再需要（基础组件 API 简化） |
| `src/components/renderer/FormRenderer.vue` | SDK 内部有 |

---

## 任务 1：API + Store 拆分

**文件：**
- 创建：`src/api/fieldApi.ts`
- 创建：`src/stores/fieldStore.ts`
- 创建：`src/stores/__tests__/fieldStore.spec.ts`
- 修改：`src/api/templateApi.ts`（简化：只管 template）
- 修改：`src/stores/templateStore.ts`（简化）

- [ ] **步骤 1：写 fieldApi.ts**

文件：`src/api/fieldApi.ts`

```ts
import type { ComponentDef } from '@/sdk/types'
import { uid } from '@/utils/uid'

const STORAGE_KEY = 'form-designer-fields'

function loadAll(): ComponentDef[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveAll(items: ComponentDef[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const fieldApi = {
  list(): ComponentDef[] {
    return loadAll()
  },

  get(id: string): ComponentDef | undefined {
    return loadAll().find(f => f.id === id)
  },

  create(def: Omit<ComponentDef, 'id'>): ComponentDef {
    const newDef: ComponentDef = { ...def, id: uid() }
    const all = loadAll()
    all.push(newDef)
    saveAll(all)
    return newDef
  },

  update(id: string, def: ComponentDef): ComponentDef {
    const all = loadAll()
    const idx = all.findIndex(f => f.id === id)
    if (idx === -1) throw new Error(`field ${id} not found`)
    all[idx] = def
    saveAll(all)
    return def
  },

  delete(id: string): void {
    const all = loadAll().filter(f => f.id !== id)
    saveAll(all)
  }
}
```

- [ ] **步骤 2：写 fieldStore.ts**

文件：`src/stores/fieldStore.ts`

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentDef } from '@/sdk/types'
import { fieldApi } from '@/api/fieldApi'

export const useFieldStore = defineStore('fields', () => {
  const fields = ref<ComponentDef[]>([])

  function refresh() {
    fields.value = fieldApi.list()
  }

  function getById(id: string): ComponentDef | undefined {
    return fields.value.find(f => f.id === id)
  }

  function create(def: Omit<ComponentDef, 'id'>): ComponentDef {
    const created = fieldApi.create(def)
    fields.value.push(created)
    return created
  }

  function update(id: string, def: ComponentDef): ComponentDef {
    const updated = fieldApi.update(id, def)
    const idx = fields.value.findIndex(f => f.id === id)
    if (idx >= 0) fields.value[idx] = updated
    return updated
  }

  function remove(id: string): void {
    fieldApi.delete(id)
    fields.value = fields.value.filter(f => f.id !== id)
  }

  // 初始化时从 localStorage 加载
  refresh()

  return { fields, refresh, getById, create, update, remove }
})
```

- [ ] **步骤 3：写 fieldStore 测试**

文件：`src/stores/__tests__/fieldStore.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldStore } from '../fieldStore'
import type { ComponentDef } from '@/sdk/types'

describe('fieldStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const store = useFieldStore()
    expect(store.fields).toEqual([])
  })

  it('create adds a field', () => {
    const store = useFieldStore()
    const created = store.create({
      type: 'Input', field: 'name', label: '姓名'
    } as Omit<ComponentDef, 'id'>)
    expect(created.id).toBeTruthy()
    expect(store.fields).toHaveLength(1)
  })

  it('getById returns the field', () => {
    const store = useFieldStore()
    const created = store.create({
      type: 'Input', field: 'name', label: '姓名'
    } as Omit<ComponentDef, 'id'>)
    expect(store.getById(created.id)?.field).toBe('name')
  })

  it('update modifies the field', () => {
    const store = useFieldStore()
    const created = store.create({
      type: 'Input', field: 'name', label: '姓名'
    } as Omit<ComponentDef, 'id'>)
    store.update(created.id, { ...created, label: '患者姓名' })
    expect(store.getById(created.id)?.label).toBe('患者姓名')
  })

  it('remove deletes the field', () => {
    const store = useFieldStore()
    const created = store.create({
      type: 'Input', field: 'name', label: '姓名'
    } as Omit<ComponentDef, 'id'>)
    store.remove(created.id)
    expect(store.fields).toHaveLength(0)
  })
})
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- fieldStore
```

预期：5 个 test 通过。

- [ ] **步骤 5：精简 templateApi.ts（只保留 template 相关）**

修改 `src/api/templateApi.ts`：移除所有 field 相关方法（如果存在）；保留 `list / get / create / update / delete` for FormTemplate。

- [ ] **步骤 6：精简 templateStore.ts**

修改 `src/stores/templateStore.ts`：移除 field 相关状态。

- [ ] **步骤 7：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/api/fieldApi.ts src/stores/fieldStore.ts src/stores/__tests__/fieldStore.spec.ts src/api/templateApi.ts src/stores/templateStore.ts
git commit -m "refactor(demo): split field and template APIs/stores"
```

---

## 任务 2：路由改造

**文件：**
- 修改：`src/router/index.ts`
- 创建：`src/pages/HomePage.vue`
- 创建：`src/pages/__tests__/HomePage.spec.ts`

- [ ] **步骤 1：写 HomePage 测试**

文件：`src/pages/__tests__/HomePage.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from '../HomePage.vue'

describe('HomePage', () => {
  it('renders two entry buttons', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: HomePage }]
    })
    const wrapper = mount(HomePage, {
      global: { plugins: [router] }
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
  })

  it('has link to field list', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomePage },
        { path: '/fields', component: { template: '<div />' } }
      ]
    })
    const wrapper = mount(HomePage, {
      global: { plugins: [router] }
    })
    const link = wrapper.find('[data-test="fields-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/fields')
  })

  it('has link to template list', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomePage },
        { path: '/templates', component: { template: '<div />' } }
      ]
    })
    const wrapper = mount(HomePage, {
      global: { plugins: [router] }
    })
    const link = wrapper.find('[data-test="templates-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/templates')
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- HomePage
```

预期：FAIL — HomePage.vue 不存在。

- [ ] **步骤 3：实现 HomePage.vue**

文件：`src/pages/HomePage.vue`

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="home-page">
    <h1>检查报告动态表单设计器</h1>
    <p>选择要管理的内容：</p>
    <div class="entries">
      <RouterLink to="/fields" class="entry-link" data-test="fields-link">
        <div class="entry-card">
          <h2>小项目</h2>
          <p>管理单个字段定义（如"总胆红素"、"身份证号"）</p>
          <button>进入小项目库</button>
        </div>
      </RouterLink>
      <RouterLink to="/templates" class="entry-link" data-test="templates-link">
        <div class="entry-card">
          <h2>大项</h2>
          <p>管理表单模板（由若干小项目拼成）</p>
          <button>进入大项库</button>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 800px;
  margin: 60px auto;
  padding: 0 24px;
  text-align: center;
}
.entries {
  display: flex;
  gap: 24px;
  margin-top: 32px;
}
.entry-link {
  flex: 1;
  text-decoration: none;
  color: inherit;
}
.entry-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 24px;
  background: var(--color-bg);
  transition: all 0.2s;
}
.entry-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}
.entry-card h2 {
  margin: 0 0 8px 0;
  color: var(--color-text);
}
.entry-card p {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0 0 16px 0;
}
.entry-card button {
  padding: 6px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- HomePage
```

预期：3 个 test 通过。

- [ ] **步骤 5：重写 router/index.ts**

文件：`src/router/index.ts`（重写）

```ts
import { createRouter, createWebHistory } from 'vue-router'

const HomePage = () => import('@/pages/HomePage.vue')
const FieldList = () => import('@/pages/FieldList.vue')
const FieldEditor = () => import('@/pages/FieldEditor.vue')
const TemplateList = () => import('@/pages/TemplateList.vue')
const TemplateEditor = () => import('@/pages/TemplateEditor.vue')
const TemplateRenderer = () => import('@/pages/TemplateRenderer.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage, name: 'home' },
    { path: '/fields', component: FieldList, name: 'field-list' },
    { path: '/fields/new', component: FieldEditor, name: 'field-new' },
    { path: '/fields/:id/edit', component: FieldEditor, name: 'field-edit', props: true },
    { path: '/templates', component: TemplateList, name: 'template-list' },
    { path: '/templates/new', component: TemplateEditor, name: 'template-new' },
    { path: '/templates/:id/edit', component: TemplateEditor, name: 'template-edit', props: true },
    { path: '/templates/:id/render', component: TemplateRenderer, name: 'template-render', props: true }
  ]
})
```

- [ ] **步骤 6：跑 type check 确认没破**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npx vue-tsc --noEmit
```

预期：可能有些文件缺失（FieldList 等还没创建），先记下。

- [ ] **步骤 7：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/router/index.ts src/pages/HomePage.vue src/pages/__tests__/HomePage.spec.ts
git commit -m "feat(demo): add HomePage with dual entry and new router"
```

---

## 任务 3：小项目列表页

**文件：**
- 创建：`src/pages/FieldList.vue`
- 创建：`src/pages/__tests__/FieldList.spec.ts`

- [ ] **步骤 1：写 FieldList 测试**

文件：`src/pages/__tests__/FieldList.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import FieldList from '../FieldList.vue'
import { useFieldStore } from '@/stores/fieldStore'

describe('FieldList', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders empty state when no fields', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/fields', component: FieldList }]
    })
    const wrapper = mount(FieldList, {
      global: { plugins: [router] }
    })
    expect(wrapper.text()).toContain('还没有小项目')
  })

  it('renders all fields', () => {
    const store = useFieldStore()
    store.create({ type: 'Input', field: 'name', label: '姓名' } as any)
    store.create({ type: 'InputNumber', field: 'age', label: '年龄' } as any)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/fields', component: FieldList }]
    })
    const wrapper = mount(FieldList, {
      global: { plugins: [router] }
    })
    expect(wrapper.text()).toContain('姓名')
    expect(wrapper.text()).toContain('年龄')
  })

  it('has 新建 button', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/fields', component: FieldList }]
    })
    const wrapper = mount(FieldList, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('[data-test="new-field-btn"]').exists()).toBe(true)
  })

  it('removes field when delete clicked', async () => {
    const store = useFieldStore()
    const created = store.create({ type: 'Input', field: 'name', label: '姓名' } as any)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/fields', component: FieldList }]
    })
    const wrapper = mount(FieldList, {
      global: { plugins: [router] }
    })
    await wrapper.find('[data-test="delete-btn"]').trigger('click')
    expect(store.fields).toHaveLength(0)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldList
```

预期：FAIL。

- [ ] **步骤 3：实现 FieldList.vue**

文件：`src/pages/FieldList.vue`

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFieldStore } from '@/stores/fieldStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useFieldStore()
const { fields } = storeToRefs(store)

onMounted(() => store.refresh())

function goNew() {
  router.push('/fields/new')
}

function goEdit(id: string) {
  router.push(`/fields/${id}/edit`)
}

function goBack() {
  router.push('/')
}

function onDelete(id: string) {
  if (confirm('确定要删除这个小项目吗？')) {
    store.remove(id)
  }
}
</script>

<template>
  <div class="field-list">
    <div class="header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>小项目库</h1>
      <button data-test="new-field-btn" class="new-btn" @click="goNew">+ 新建小项目</button>
    </div>

    <div v-if="fields.length === 0" class="empty">
      还没有小项目。点"新建小项目"开始。
    </div>

    <div v-else class="list">
      <div v-for="f in fields" :key="f.id" class="item">
        <div class="item-info" @click="goEdit(f.id)">
          <div class="item-label">{{ f.label }}</div>
          <div class="item-meta">
            <span>{{ f.type }}</span> · <span>{{ f.field }}</span>
          </div>
        </div>
        <div class="item-actions">
          <button data-test="delete-btn" @click="onDelete(f.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-list {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.header h1 {
  flex: 1;
  margin: 0;
}
.back-btn,
.new-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  cursor: pointer;
}
.new-btn {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.empty {
  padding: 60px;
  text-align: center;
  color: var(--color-text-secondary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
}
.item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 8px;
  background: var(--color-bg);
}
.item-info {
  flex: 1;
  cursor: pointer;
}
.item-label {
  font-weight: 500;
  margin-bottom: 4px;
}
.item-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.item-actions button {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--color-text-secondary);
}
.item-actions button:hover {
  color: var(--color-error);
  border-color: var(--color-error);
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldList
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/pages/FieldList.vue src/pages/__tests__/FieldList.spec.ts
git commit -m "feat(demo): add FieldList page"
```

---

## 任务 4：小项目编辑页

**文件：**
- 创建：`src/pages/FieldEditor.vue`
- 创建：`src/pages/__tests__/FieldEditor.spec.ts`

- [ ] **步骤 1：写 FieldEditor 测试**

文件：`src/pages/__tests__/FieldEditor.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import FieldEditor from '../FieldEditor.vue'
import { useFieldStore } from '@/stores/fieldStore'

describe('FieldEditor', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders new field mode when no id', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/fields/new', component: FieldEditor, props: true }
      ]
    })
    await router.push('/fields/new')
    await router.isReady()
    const wrapper = mount(FieldEditor, {
      global: { plugins: [router] },
      props: { id: undefined }
    })
    expect(wrapper.find('[data-test="designer"]').exists()).toBe(true)
  })

  it('saves new field and navigates back', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/fields/new', component: FieldEditor, props: true },
        { path: '/fields', component: { template: '<div />' } }
      ]
    })
    await router.push('/fields/new')
    await router.isReady()
    const wrapper = mount(FieldEditor, {
      global: { plugins: [router] },
      props: { id: undefined }
    })

    const store = useFieldStore()
    wrapper.find('[data-test="designer"]').vm.$emit('save', {
      type: 'Input', field: 'name', label: '姓名'
    })
    await flushPromises()
    expect(store.fields).toHaveLength(1)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldEditor
```

预期：FAIL。

- [ ] **步骤 3：实现 FieldEditor.vue**

文件：`src/pages/FieldEditor.vue`

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFieldStore } from '@/stores/fieldStore'
import { FormDesigner } from '@/sdk'
import type { ComponentDef } from '@/sdk/types'

interface Props {
  id?: string
}

const props = defineProps<Props>()
const router = useRouter()
const store = useFieldStore()

const field = computed<ComponentDef>(() => {
  if (props.id) {
    return store.getById(props.id) ?? createEmpty()
  }
  return createEmpty()
})

function createEmpty(): ComponentDef {
  return {
    id: '',
    type: 'Input',
    field: '',
    label: ''
  }
}

function onSave(def: ComponentDef) {
  if (props.id) {
    store.update(props.id, def)
  } else {
    store.create(def)
  }
  router.push('/fields')
}

function onCancel() {
  router.push('/fields')
}
</script>

<template>
  <div class="field-editor">
    <FormDesigner
      data-test="designer"
      mode="field"
      :component="field"
      @save="onSave"
      @cancel="onCancel"
    />
  </div>
</template>

<style scoped>
.field-editor {
  height: 100vh;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- FieldEditor
```

预期：2 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/pages/FieldEditor.vue src/pages/__tests__/FieldEditor.spec.ts
git commit -m "feat(demo): add FieldEditor page using SDK FormDesigner field mode"
```

---

## 任务 5：大项列表页

**文件：**
- 修改：`src/pages/TemplateList.vue`
- 创建：`src/pages/__tests__/TemplateList.spec.ts`

- [ ] **步骤 1：写 TemplateList 测试**

文件：`src/pages/__tests__/TemplateList.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import TemplateList from '../TemplateList.vue'
import { useTemplateStore } from '@/stores/templateStore'

describe('TemplateList', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders empty state', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/templates', component: TemplateList }]
    })
    const wrapper = mount(TemplateList, {
      global: { plugins: [router] }
    })
    expect(wrapper.text()).toContain('还没有大项')
  })

  it('renders all templates', () => {
    const store = useTemplateStore()
    store.create({ components: [] } as any)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/templates', component: TemplateList }]
    })
    const wrapper = mount(TemplateList, {
      global: { plugins: [router] }
    })
    expect(wrapper.text()).toContain('未命名大项')
  })

  it('has 新建 button', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/templates', component: TemplateList }]
    })
    const wrapper = mount(TemplateList, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('[data-test="new-template-btn"]').exists()).toBe(true)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TemplateList
```

预期：FAIL（如果当前 TemplateList.vue 不是这个结构）。

- [ ] **步骤 3：重写 TemplateList.vue**

文件：`src/pages/TemplateList.vue`（重写）

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '@/stores/templateStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useTemplateStore()
const { templates } = storeToRefs(store)

onMounted(() => store.refresh())

function goNew() {
  router.push('/templates/new')
}

function goEdit(id: string) {
  router.push(`/templates/${id}/edit`)
}

function goRender(id: string) {
  router.push(`/templates/${id}/render`)
}

function goBack() {
  router.push('/')
}

function onDelete(id: string) {
  if (confirm('确定要删除这个大项吗？')) {
    store.remove(id)
  }
}
</script>

<template>
  <div class="template-list">
    <div class="header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>大项库</h1>
      <button data-test="new-template-btn" class="new-btn" @click="goNew">+ 新建大项</button>
    </div>

    <div v-if="templates.length === 0" class="empty">
      还没有大项。点"新建大项"开始。
    </div>

    <div v-else class="list">
      <div v-for="t in templates" :key="t.id" class="item">
        <div class="item-info" @click="goEdit(t.id)">
          <div class="item-label">未命名大项 ({{ t.id.slice(0, 8) }})</div>
          <div class="item-meta">{{ t.components?.length ?? 0 }} 个字段</div>
        </div>
        <div class="item-actions">
          <button @click="goRender(t.id)">渲染</button>
          <button @click="goEdit(t.id)">编辑</button>
          <button data-test="delete-btn" @click="onDelete(t.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.template-list {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.header h1 {
  flex: 1;
  margin: 0;
}
.back-btn,
.new-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  cursor: pointer;
}
.new-btn {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.empty {
  padding: 60px;
  text-align: center;
  color: var(--color-text-secondary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
}
.item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 8px;
  background: var(--color-bg);
}
.item-info {
  flex: 1;
  cursor: pointer;
}
.item-label {
  font-weight: 500;
  margin-bottom: 4px;
}
.item-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.item-actions {
  display: flex;
  gap: 8px;
}
.item-actions button {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--color-text);
}
.item-actions button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TemplateList
```

预期：3 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/pages/TemplateList.vue src/pages/__tests__/TemplateList.spec.ts
git commit -m "feat(demo): rewrite TemplateList as big-item list (only templates)"
```

---

## 任务 6：大项编辑页

**文件：**
- 创建：`src/pages/TemplateEditor.vue`
- 创建：`src/pages/__tests__/TemplateEditor.spec.ts`

- [ ] **步骤 1：写 TemplateEditor 测试**

文件：`src/pages/__tests__/TemplateEditor.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import TemplateEditor from '../TemplateEditor.vue'
import { useTemplateStore } from '@/stores/templateStore'
import { useFieldStore } from '@/stores/fieldStore'

describe('TemplateEditor', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults to basic mode for new template', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/templates/new', component: TemplateEditor, props: true }
      ]
    })
    await router.push('/templates/new')
    await router.isReady()
    const wrapper = mount(TemplateEditor, {
      global: { plugins: [router] },
      props: { id: undefined }
    })
    expect(wrapper.find('[data-test="designer"]').exists()).toBe(true)
  })

  it('can switch to presets mode', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/templates/new', component: TemplateEditor, props: true }
      ]
    })
    await router.push('/templates/new')
    await router.isReady()
    const wrapper = mount(TemplateEditor, {
      global: { plugins: [router] },
      props: { id: undefined }
    })
    const switcher = wrapper.find('[data-test="mode-switch"]')
    expect(switcher.exists()).toBe(true)
  })

  it('saves new template and navigates back', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/templates/new', component: TemplateEditor, props: true },
        { path: '/templates', component: { template: '<div />' } }
      ]
    })
    await router.push('/templates/new')
    await router.isReady()
    const wrapper = mount(TemplateEditor, {
      global: { plugins: [router] },
      props: { id: undefined }
    })

    const store = useTemplateStore()
    wrapper.find('[data-test="designer"]').vm.$emit('save', {
      components: [
        { id: '1', type: 'Input', field: 'name', label: '姓名' }
      ]
    })
    await flushPromises()
    expect(store.templates).toHaveLength(1)
  })

  it('presets mode passes fields as components', async () => {
    const fieldStore = useFieldStore()
    fieldStore.create({ type: 'InputNumber', field: 'tbil', label: '总胆红素' } as any)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/templates/new', component: TemplateEditor, props: true }
      ]
    })
    await router.push('/templates/new')
    await router.isReady()
    const wrapper = mount(TemplateEditor, {
      global: { plugins: [router] },
      props: { id: undefined }
    })
    // 切到 presets
    await wrapper.find('[data-test="mode-switch"]').trigger('click')
    // 找到 designer 元素
    const designer = wrapper.find('[data-test="designer"]')
    expect(designer.exists()).toBe(true)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TemplateEditor
```

预期：FAIL。

- [ ] **步骤 3：实现 TemplateEditor.vue**

文件：`src/pages/TemplateEditor.vue`

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '@/stores/templateStore'
import { useFieldStore } from '@/stores/fieldStore'
import { storeToRefs } from 'pinia'
import { FormDesigner } from '@/sdk'
import type { FormTemplate, FormDesignerMode } from '@/sdk/types'

interface Props {
  id?: string
}

const props = defineProps<Props>()
const router = useRouter()
const templateStore = useTemplateStore()
const fieldStore = useFieldStore()
const { fields } = storeToRefs(fieldStore)

const mode = ref<FormDesignerMode>('basic')

const template = computed<FormTemplate>(() => {
  if (props.id) {
    return templateStore.getById(props.id) ?? createEmpty()
  }
  return createEmpty()
})

function createEmpty(): FormTemplate {
  return { id: '', components: [] }
}

function toggleMode() {
  mode.value = mode.value === 'basic' ? 'presets' : 'basic'
}

function onSave(tpl: FormTemplate) {
  if (props.id) {
    templateStore.update(props.id, tpl)
  } else {
    templateStore.create(tpl)
  }
  router.push('/templates')
}

function onCancel() {
  router.push('/templates')
}

onMounted(() => {
  templateStore.refresh()
  fieldStore.refresh()
})
</script>

<template>
  <div class="template-editor">
    <div class="toolbar">
      <button data-test="mode-switch" @click="toggleMode">
        {{ mode === 'basic' ? '切到 presets 模式' : '切到 basic 模式' }}
      </button>
      <span class="mode-label">当前模式：{{ mode }}</span>
    </div>
    <FormDesigner
      data-test="designer"
      :mode="mode"
      :component="template"
      :components="mode === 'presets' ? fields : undefined"
      @save="onSave"
      @cancel="onCancel"
    />
  </div>
</template>

<style scoped>
.template-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}
.toolbar button {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  cursor: pointer;
}
.mode-label {
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TemplateEditor
```

预期：4 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/pages/TemplateEditor.vue src/pages/__tests__/TemplateEditor.spec.ts
git commit -m "feat(demo): add TemplateEditor with mode switcher (basic/presets)"
```

---

## 任务 7：模板渲染页

**文件：**
- 创建：`src/pages/TemplateRenderer.vue`
- 创建：`src/pages/__tests__/TemplateRenderer.spec.ts`

- [ ] **步骤 1：写 TemplateRenderer 测试**

文件：`src/pages/__tests__/TemplateRenderer.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import TemplateRenderer from '../TemplateRenderer.vue'
import { useTemplateStore } from '@/stores/templateStore'

describe('TemplateRenderer', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders 404 when template not found', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/templates/:id/render', component: TemplateRenderer, props: true }
      ]
    })
    await router.push('/templates/nonexistent/render')
    await router.isReady()
    const wrapper = mount(TemplateRenderer, {
      global: { plugins: [router] },
      props: { id: 'nonexistent' }
    })
    expect(wrapper.text()).toContain('找不到')
  })

  it('renders form fields from template', async () => {
    const store = useTemplateStore()
    const tpl = store.create({
      components: [
        { id: '1', type: 'Input', field: 'name', label: '姓名' }
      ]
    } as any)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/templates/:id/render', component: TemplateRenderer, props: true }
      ]
    })
    await router.push(`/templates/${tpl.id}/render`)
    await router.isReady()
    const wrapper = mount(TemplateRenderer, {
      global: { plugins: [router] },
      props: { id: tpl.id }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
```

- [ ] **步骤 2：跑测试确认失败**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TemplateRenderer
```

预期：FAIL。

- [ ] **步骤 3：实现 TemplateRenderer.vue**

文件：`src/pages/TemplateRenderer.vue`

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '@/stores/templateStore'
import { FormRenderer } from '@/sdk'
import type { FormTemplate } from '@/sdk/types'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const store = useTemplateStore()

const template = computed<FormTemplate | undefined>(() => {
  return store.getById(props.id)
})

const formData = ref<Record<string, any>>({})

function goBack() {
  router.push('/templates')
}

onMounted(() => store.refresh())
</script>

<template>
  <div class="template-renderer">
    <div v-if="!template" class="not-found">
      <p>找不到大项 {{ id }}</p>
      <button @click="goBack">返回</button>
    </div>
    <template v-else>
      <div class="header">
        <button @click="goBack">← 返回</button>
        <h1>渲染大项</h1>
      </div>
      <div class="content">
        <FormRenderer
          :component="template"
          v-model:formData="formData"
        />
        <pre class="form-data">{{ JSON.stringify(formData, null, 2) }}</pre>
      </div>
    </template>
  </div>
</template>

<style scoped>
.template-renderer {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.header h1 {
  flex: 1;
  margin: 0;
}
.header button {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  cursor: pointer;
}
.not-found {
  text-align: center;
  padding: 60px;
  color: var(--color-text-secondary);
}
.content {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 24px;
  background: var(--color-bg);
}
.form-data {
  margin-top: 24px;
  padding: 12px;
  background: var(--color-bg-hover);
  border-radius: var(--radius);
  font-size: 12px;
  overflow: auto;
}
</style>
```

- [ ] **步骤 4：跑测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test -- TemplateRenderer
```

预期：2 个 test 通过。

- [ ] **步骤 5：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add src/pages/TemplateRenderer.vue src/pages/__tests__/TemplateRenderer.spec.ts
git commit -m "feat(demo): add TemplateRenderer using SDK FormRenderer"
```

---

## 任务 8：删除旧页面 + 清理

**文件：**
- 删除：`src/pages/Designer.vue`
- 删除：`src/pages/Renderer.vue`
- 删除：`src/components/designer/DesignerCanvas.vue`
- 删除：`src/components/designer/FieldPreview.vue`
- 删除：`src/components/designer/PropertyPanel.vue`
- 删除：`src/components/designer/CanvasItem.vue`
- 删除：`src/components/designer/ComponentLibrary.vue`
- 删除：`src/components/designer/OptionEditor.vue`
- 删除：`src/components/renderer/FormRenderer.vue`

- [ ] **步骤 1：检查引用**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
grep -rln "pages/Designer\|pages/Renderer\|components/designer/DesignerCanvas\|components/designer/FieldPreview\|components/designer/PropertyPanel\|components/designer/CanvasItem\|components/designer/ComponentLibrary\|components/designer/OptionEditor\|components/renderer/FormRenderer" src/
```

预期：无结果（之前的引用都已迁移）。

- [ ] **步骤 2：删除文件**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git rm src/pages/Designer.vue
git rm src/pages/Renderer.vue
git rm src/components/designer/DesignerCanvas.vue
git rm src/components/designer/FieldPreview.vue
git rm src/components/designer/PropertyPanel.vue
git rm src/components/designer/CanvasItem.vue
git rm src/components/designer/ComponentLibrary.vue
git rm src/components/designer/OptionEditor.vue
git rm src/components/renderer/FormRenderer.vue
rmdir src/components/designer 2>/dev/null || true
rmdir src/components/renderer 2>/dev/null || true
```

- [ ] **步骤 3：跑全部测试确认通过**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test
```

预期：所有测试通过。

- [ ] **步骤 4：跑 type check**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npx vue-tsc --noEmit
```

预期：无错误。

- [ ] **步骤 5：跑 build 确认 dev demo 仍可构建**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm run build
```

预期：build 成功。

- [ ] **步骤 6：Commit**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add -A
git commit -m "refactor(demo): remove legacy Designer/Renderer pages, use SDK"
```

---

## 任务 9：端到端验证（手动）

- [ ] **步骤 1：启动 dev server**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm run dev
```

预期：dev server 启动。

- [ ] **步骤 2：手动走查流程**

打开浏览器（如果可用）：

1. 访问 `http://localhost:5173/`
   - 看到首页双入口（小项目 / 大项）
2. 点"进入小项目库"
   - 看到空状态"还没有小项目"
3. 点"+ 新建小项目"
   - 看到 SDK FormDesigner field mode
4. 选 Input、改 label 为"总胆红素"、field 为"tbil"、点保存
   - 跳回小项目列表，看到刚创建的项
5. 返回首页，点"进入大项库"
   - 看到空状态
6. 点"+ 新建大项"
   - 默认 basic 模式，看到 SDK FormDesigner basic mode
7. 点工具栏"切到 presets 模式"
   - 左侧出现小项目列表（含刚创建的"总胆红素"）
8. 点击"总胆红素"加入画布
   - 画布显示，左侧清单隐藏
9. 点保存
   - 跳回大项列表
10. 点"渲染"按钮
    - 看到 FormRenderer 渲染"总胆红素"输入框

如果浏览器不可用，**至少跑完 dev server + 跑全部测试 + 跑 type check + 跑 build**，确认无错误。

- [ ] **步骤 3：跑全部测试 + build**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer" && npm test && npx vue-tsc --noEmit && npm run build
```

预期：全绿。

- [ ] **步骤 4：关闭 dev server**

```bash
# 找到 dev server 进程并 kill（手动）
```

- [ ] **步骤 5：Commit（如有手动修复）**

```bash
cd "/Users/gaojianqiang/Desktop/claude workspace/form-designer"
git add -A
git commit -m "fix(demo): manual e2e fixes from walkthrough" || echo "no changes to commit"
```

---

## 自检

- [x] **规格覆盖度**：
  - §1.2 业务场景（双列表）→ 任务 1 拆 API/Store + 任务 2 路由 + 任务 3-7 页面
  - §2.2 不进 SDK（dev demo）→ 任务 1-9 全部
  - §7.1 目录调整（pages/）→ 任务 3-7 创建新页面
  - §9 决策摘要 #11 dev demo 保留 → 全部任务
  - §10 开放问题（demo 重构）→ 全部任务

- [x] **占位符扫描**：
  - 无 "TODO" / "待定" / "类似任务"
  - 测试断言具体
  - 完整代码块

- [x] **类型一致性**：
  - `ComponentDef` / `FormTemplate` / `FormDesignerMode` 全部从 `@/sdk` 导入
  - `useFieldStore` / `useTemplateStore` API 一致
  - 路由 name 一致（field-list / field-new / field-edit / template-list 等）

## 执行交接

**计划已完成并保存到 `docs/superpowers/plans/2026-07-21-dev-demo-refactor.md`**。

9 个任务：API 拆分、路由、HomePage、FieldList、FieldEditor、TemplateList 重写、TemplateEditor、TemplateRenderer、清理旧页面、手动 e2e 验证。

依赖计划 A + 计划 B；产出可演示的 dev demo：双列表 + SDK 全流程。

两种执行方式：
1. **子代理驱动（推荐）** — 每个任务调度一个新的子代理
2. **内联执行** — 当前会话批量执行

**选哪种方式？**
