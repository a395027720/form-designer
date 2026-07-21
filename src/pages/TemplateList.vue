<template>
  <div class="app-page">
    <header class="page-header">
      <h1>📋 检查报告模板管理</h1>
      <a-space>
        <a-button @click="onImport">
          导入 JSON
        </a-button>
        <a-button type="primary" @click="onCreate">
          + 新建模板
        </a-button>
      </a-space>
    </header>

    <main class="page-content">
      <a-space style="margin-bottom: 16px" wrap>
        <a-input-search
          v-model:value="keyword"
          placeholder="按名称/分类搜索"
          style="width: 260px"
          allow-clear
        />
        <a-select
          v-model:value="categoryFilter"
          placeholder="按分类筛选"
          style="width: 160px"
          allow-clear
        >
          <a-select-option v-for="c in categories" :key="c" :value="c">
            {{ c }}
          </a-select-option>
        </a-select>
        <a-button @click="onResetSamples" v-if="filtered.length === 0">
          重置为示例模板
        </a-button>
      </a-space>

      <a-empty v-if="filtered.length === 0" description="还没有模板，点击右上角新建或重置示例" />

      <div v-else class="template-grid">
        <a-card
          v-for="t in filtered"
          :key="t.id"
          class="template-card"
          hoverable
        >
          <template #title>
            <div class="card-title">
              <span class="name">{{ t.name }}</span>
              <a-tag color="blue">{{ t.category }}</a-tag>
            </div>
          </template>
          <template #extra>
            <a-space>
              <a-tooltip title="预览渲染">
                <a-button size="small" type="link" @click="onPreview(t.id)">预览</a-button>
              </a-tooltip>
              <a-tooltip title="编辑">
                <a-button size="small" type="link" @click="onEdit(t.id)">编辑</a-button>
              </a-tooltip>
            </a-space>
          </template>
          <p class="text-muted" style="min-height: 40px">
            {{ t.description || '暂无描述' }}
          </p>
          <div class="card-footer">
            <span class="text-muted">📦 {{ t.componentCount }} 个组件</span>
            <span class="text-muted">{{ formatDate(t.updatedAt) }}</span>
          </div>
          <div class="card-actions">
            <a-button size="small" @click="onDuplicate(t.id)">复制</a-button>
            <a-button size="small" @click="onExport(t.id)">导出</a-button>
            <a-popconfirm title="确定删除该模板？" @confirm="onDelete(t.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </div>
        </a-card>
      </div>
    </main>

    <input ref="fileInput" type="file" accept=".json" style="display: none" @change="handleFileChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { templateApi } from '@/api/templateApi'
import type { TemplateMeta } from '@/types/template'

const router = useRouter()
const templates = ref<TemplateMeta[]>([])
const keyword = ref('')
const categoryFilter = ref<string | undefined>()
const fileInput = ref<HTMLInputElement>()

const refresh = () => {
  templates.value = templateApi.list()
}

const categories = computed(() =>
  Array.from(new Set(templates.value.map(t => t.category)))
)

const filtered = computed(() =>
  templates.value.filter(t => {
    if (categoryFilter.value && t.category !== categoryFilter.value) return false
    if (keyword.value) {
      const k = keyword.value.toLowerCase()
      return (
        t.name.toLowerCase().includes(k) ||
        t.category.toLowerCase().includes(k)
      )
    }
    return true
  })
)

const onCreate = () => {
  const t = templateApi.create()
  router.push(`/templates/${t.id}/edit`)
}

const onEdit = (id: string) => {
  router.push(`/templates/${id}/edit`)
}

const onPreview = (id: string) => {
  router.push(`/renderer/${id}`)
}

const onDuplicate = (id: string) => {
  templateApi.duplicate(id)
  refresh()
  message.success('已复制')
}

const onExport = (id: string) => {
  templateApi.export(id)
  message.success('已导出 JSON 文件')
}

const onDelete = (id: string) => {
  templateApi.remove(id)
  refresh()
  message.success('已删除')
}

const onImport = () => {
  fileInput.value?.click()
}

const handleFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const t = await templateApi.import(file)
    refresh()
    message.success(`已导入：${t.name}`)
  } catch (err) {
    message.error('导入失败：JSON 格式不合法')
  }
  if (fileInput.value) fileInput.value.value = ''
}

const onResetSamples = () => {
  templateApi.reset()
  refresh()
  message.success('已重置为示例模板')
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

onMounted(refresh)
</script>

<style scoped>
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.template-card {
  background: #fff;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-title .name {
  font-weight: 600;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin: 12px 0;
}
.card-actions {
  display: flex;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}
</style>