<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { templateApi, type TemplateMeta } from '@/api/templateApi'

const router = useRouter()

const templates = computed(() => templateApi.list())

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 200 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '描述', dataIndex: 'description', key: 'description' }
]

// 行点击进入编辑
function customRow(record: TemplateMeta) {
  return {
    onClick: () => goEdit(record.id),
    style: 'cursor: pointer'
  }
}

function goNewBasic() { router.push('/templates/new/basic') }
function goNewPresets() { router.push('/templates/new/presets') }
function goEdit(id: string) { router.push(`/templates/${id}/edit`) }
function goBack() { router.push('/') }
</script>

<template>
  <div class="template-list">
    <div class="header">
      <a-button @click="goBack">← 返回</a-button>
      <h1>大项库</h1>
      <a-space>
        <a-button type="primary" @click="goNewBasic">+ 从零新建</a-button>
        <a-button @click="goNewPresets">+ 从字段库新建</a-button>
      </a-space>
    </div>

    <a-empty v-if="templates.length === 0" description="还没有模板，点击上方按钮创建" />

    <a-table
      v-else
      :data-source="templates"
      :columns="columns"
      :row-key="(t: TemplateMeta) => t.id"
      :pagination="false"
      bordered
      class="template-table"
      :custom-row="customRow"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a class="tpl-link" @click="goEdit((record as TemplateMeta).id)">{{ record.name }}</a>
        </template>
        <template v-else-if="column.key === 'description'">
          <span v-if="(record as TemplateMeta).description">{{ record.description }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </template>
    </a-table>
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
  font-size: 20px;
}
.template-table {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.tpl-link {
  color: var(--color-primary, #1677ff);
}
.tpl-link:hover {
  text-decoration: underline;
}
.text-muted {
  color: #94a3b8;
}
</style>
