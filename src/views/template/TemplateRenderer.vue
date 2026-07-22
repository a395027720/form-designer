<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { templateApi } from '@/api/templateApi'
import { FormRenderer } from '@/components/form-designer'
import type { FormTemplate } from '@/components/form-designer'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()

const component = ref<FormTemplate | null>(null)
const isPreview = ref(false)
const showJson = ref(false)
const rendererRef = ref<InstanceType<typeof FormRenderer> | null>(null)

function toggleJson() {
  showJson.value = !showJson.value
}

function handleSave() {
  if (!rendererRef.value) return
  const result = rendererRef.value.submit()
  if (result.ok) {
    message.success('校验通过')
    console.log('表单数据:', JSON.stringify(result.data, null, 2))
  } else {
    message.error('校验未通过，请检查标红字段')
    console.log('校验错误:', result.errors)
  }
}

onMounted(() => {
  // 优先级：先查 sessionStorage 里的预览快照（跨 Tab 共享，编辑器写入后即读即清）
  const previewRaw = sessionStorage.getItem('__preview_template__')
  if (previewRaw) {
    try {
      const { id, tpl } = JSON.parse(previewRaw) as { id: string; tpl: FormTemplate }
      if (id === props.id) {
        component.value = tpl
        isPreview.value = true
        sessionStorage.removeItem('__preview_template__')
        return
      }
    } catch { /* ignore */ }
  }

  // 回退：内存 store（同 Tab 链接的预览，或看已发布的示例模板）
  const tpl = templateApi.get(props.id)
  if (tpl) {
    component.value = JSON.parse(JSON.stringify(tpl))
  }
})

function goBack() {
  if (isPreview.value) {
    window.close()
  } else if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/templates')
  }
}
</script>

<template>
  <div class="template-renderer">
    <div class="renderer-header">
      <a-button @click="goBack">← 返回</a-button>
      <h1>{{ component?.name ?? '模板预览' }}</h1>
      <a-space v-if="component">
        <a-button @click="toggleJson">{{ showJson ? '收起 JSON' : '查看 JSON' }}</a-button>
        <a-button type="primary" @click="handleSave">保存</a-button>
      </a-space>
    </div>

    <div v-if="showJson && component" class="json-panel">
      <pre>{{ JSON.stringify(component, null, 2) }}</pre>
    </div>

    <div v-if="!component" class="empty">
      模板不存在或已被删除。
    </div>

    <FormRenderer ref="rendererRef" v-else :component="component" />
  </div>
</template>

<style scoped>
.template-renderer {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.renderer-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.renderer-header h1 {
  margin: 0;
  font-size: 18px;
  flex: 1;
}
.json-panel {
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
  max-height: 400px;
  overflow: auto;
}
.json-panel pre {
  margin: 0;
  padding: 16px;
  font-size: 12px;
  font-family: 'SF Mono', Menlo, Monaco, monospace;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-all;
}
.empty {
  padding: 60px;
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
