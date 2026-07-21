<template>
  <div class="app-page">
    <header class="page-header">
      <a-space>
        <a-button @click="onBack">← 返回</a-button>
        <h1 style="margin: 0">{{ template?.name || '加载中...' }}</h1>
        <a-tag v-if="template" color="blue">{{ template.category }}</a-tag>
      </a-space>
      <a-space>
        <a-button @click="onEdit" v-if="template">编辑模板</a-button>
      </a-space>
    </header>

    <main class="page-content">
      <a-card v-if="template" style="max-width: 1080px; margin: 0 auto">
        <a-alert
          v-if="template.description"
          :message="template.description"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />
        <FormRenderer :template="template" :initial-values="initialValues" show-preview-json />
      </a-card>
      <a-empty v-else description="模板不存在或加载失败">
        <a-button type="primary" @click="onBack">返回模板列表</a-button>
      </a-empty>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { templateApi } from '@/api/templateApi'
import type { FormTemplate } from '@/types/template'
import FormRenderer from '@/components/renderer/FormRenderer.vue'

const route = useRoute()
const router = useRouter()
const template = ref<FormTemplate | null>(null)
const initialValues = ref<Record<string, any> | undefined>(undefined)

const onBack = () => {
  if (window.opener) {
    window.close()
  } else {
    router.push('/templates')
  }
}

const onEdit = () => {
  if (!template.value) return
  router.push(`/templates/${template.value.id}/edit`)
}

/**
 * 从 URL query 解析 initial 值。
 * 接受 URL 编码的 JSON 字符串，例如：
 *   /renderer/tmpl_xxx?initial=%7B%22patientName%22%3A%22%E5%BC%A0%E4%B8%89%22%7D
 */
const parseInitialQuery = (raw: unknown): Record<string, any> | undefined => {
  if (typeof raw !== 'string' || !raw) return undefined
  try {
    return JSON.parse(decodeURIComponent(raw)) as Record<string, any>
  } catch (e) {
    console.warn('[Renderer] ?initial= 解析失败：', e)
    return undefined
  }
}

onMounted(() => {
  const id = route.params.templateId as string
  // 优先取预览临时存储
  const previewRaw = localStorage.getItem('__preview_template__')
  if (previewRaw) {
    try {
      const t = JSON.parse(previewRaw) as FormTemplate
      if (t.id === id) {
        template.value = t
        return
      }
    } catch { /* ignore */ }
  }
  const t = templateApi.get(id)
  if (!t) {
    message.error('模板不存在')
    return
  }
  template.value = t
  // 解析 ?initial=<urlencoded-json>，按 field 索引的对象
  const parsed = parseInitialQuery(route.query.initial)
  if (parsed) {
    initialValues.value = parsed
    console.log('[Renderer] 已应用 initialValues:', parsed)
  }
})
</script>

<style scoped>
.page-content {
  padding: 24px;
}
</style>