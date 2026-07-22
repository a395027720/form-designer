<script setup lang="ts">
const entries = [
  {
    to: '/templates',
    title: '自由设计',
    badge: 'basic',
    desc: '从组件库拖拽组件，自由搭建检查报告模板，支持排序、规则配置',
    btn: '进入设计'
  },
  {
    to: '/templates/new/presets',
    title: '字段拼装',
    badge: 'presets',
    desc: '从已有字段库中选取字段，快速拼装成检查报告模板',
    btn: '进入拼装'
  },
  {
    to: '/fields',
    title: '字段管理',
    badge: 'field',
    desc: '管理字段库中的小项目，定义标签、类型、校验规则等',
    btn: '进入管理'
  }
]
</script>

<template>
  <div class="home-page">
    <div class="home-hero">
      <h1>检查报告动态表单设计器</h1>
      <p class="subtitle">可视化配置检查报告模板，无需发版即可新增报告类型</p>
    </div>

    <a-row :gutter="20">
      <a-col v-for="entry in entries" :key="entry.to" :span="8">
        <router-link :to="entry.to" class="entry-link">
          <a-card hoverable class="entry-card">
            <template #title>
              <a-tag :color="entry.badge === 'basic' ? 'blue' : entry.badge === 'presets' ? 'purple' : 'cyan'">
                {{ entry.title }}
              </a-tag>
            </template>
            <p class="entry-desc">{{ entry.desc }}</p>
            <a-button type="primary" block>{{ entry.btn }}</a-button>
          </a-card>
        </router-link>
      </a-col>
    </a-row>

    <div class="home-footer">
      <router-link to="/templates">查看已有模板列表 →</router-link>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 960px;
  margin: 60px auto;
  padding: 0 24px;
}
.home-hero {
  text-align: center;
  margin-bottom: 40px;
}
.home-hero h1 {
  font-size: 26px;
  margin: 0 0 8px;
}
.subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}
.entry-link {
  text-decoration: none;
}
.entry-card {
  text-align: center;
}
.entry-card :deep(.ant-card-head) {
  border-bottom: none;
  min-height: auto;
  padding: 16px 16px 0;
}
.entry-card :deep(.ant-card-body) {
  padding: 12px 16px 20px;
}
.entry-desc {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 16px;
  line-height: 1.6;
  min-height: 42px;
}
.home-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 14px;
}
.home-footer a {
  color: #1677ff;
  text-decoration: none;
}
.home-footer a:hover {
  text-decoration: underline;
}
</style>
