<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { demoFields, type IndicatorRecord, columns } from '@/data/indicatorData'

const router = useRouter();
const fields = ref<IndicatorRecord[]>([...demoFields]);

function goNew() {
  router.push("/fields/new");
}
function goEdit(indicatorId: string) {
  router.push(`/fields/${indicatorId}/edit`);
}
function goBack() {
  router.push("/");
}

function onDelete(indicatorId: string) {
  if (confirm("确定要删除这个小项目吗？")) {
    fields.value = fields.value.filter((f) => f.indicatorId !== indicatorId);
  }
}

const TYPE_TAGS: Record<string, string> = {
  Input: "blue",
  Textarea: "purple",
  InputNumber: "cyan",
  Select: "orange",
  RadioGroup: "gold",
  CheckboxGroup: "orange",
  DatePicker: "purple",
  TimePicker: "purple",
  Switch: "pink",
  DisplayText: "green",
  Upload: "pink",
};
</script>

<template>
  <div class="field-list">
    <div class="header">
      <a-button @click="goBack">← 返回</a-button>
      <h1>小项目库</h1>
      <a-button type="primary" @click="goNew">+ 新建小项目</a-button>
    </div>

    <a-empty
      v-if="fields.length === 0"
      description="还没有小项目，点击上方按钮创建"
    />

    <a-table
      v-else
      :data-source="fields"
      :columns="columns"
      :pagination="false"
      row-key="indicatorId"
      size="middle"
      bordered
      :custom-row="
        (r: IndicatorRecord) => ({
          style: { cursor: 'pointer' },
          onClick: () => goEdit(r.indicatorId),
        })
      "
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'indicatorName'">
          {{ record.indicatorName }}
          <a-tag
            v-if="record.requireFlag === '1'"
            color="red"
            style="font-size: 10px; margin-left: 4px"
            >必填</a-tag
          >
        </template>
        <template v-else-if="column.key === 'indicatorAbbr'">
          <span
            v-if="record.indicatorAbbr"
            style="font-weight: 600; color: #6366f1"
            >{{ record.indicatorAbbr }}</span
          >
          <span v-else class="text-muted">-</span>
        </template>
        <template v-else-if="column.key === 'componentType'">
          <a-tag :color="TYPE_TAGS[record.componentType] || 'default'">{{
            record.componentType
          }}</a-tag>
        </template>
        <template v-else-if="column.key === 'requireFlag'">
          <span
            :style="{
              color: record.requireFlag === '1' ? '#ef4444' : '#94a3b8',
            }"
          >
            {{ record.requireFlag === "1" ? "是" : "否" }}
          </span>
        </template>
        <template v-else-if="column.key === 'indicatorUnit'">
          <span v-if="record.indicatorUnit" class="text-muted">{{
            record.indicatorUnit
          }}</span>
          <span v-else class="text-muted">-</span>
        </template>
        <template v-else-if="column.key === 'indicatorReferenceVal'">
          <span
            v-if="record.indicatorReferenceVal"
            style="font-family: monospace; font-size: 12px"
            >{{ record.indicatorReferenceVal }}</span
          >
          <span v-else class="text-muted">-</span>
        </template>
        <template v-else-if="column.key === 'categoryLabel'">
          <a-tag
            v-if="record.indicatorCustomCategoryLabel"
            color="geekblue"
            style="font-size: 11px"
            >{{ record.indicatorCustomCategoryLabel }}</a-tag
          >
          <span v-else class="text-muted">-</span>
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-button danger size="small" @click="onDelete(record.indicatorId)"
            >删除</a-button
          >
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.field-list {
  max-width: 1100px;
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
.text-muted {
  color: #94a3b8;
}
</style>
