<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { FormDesigner, uid } from "@/components/form-designer";
import { demoFields, parseComponent, toIndicatorRecord } from "@/data/indicatorData";
import type { ComponentDef, FormTemplate } from "@/components/form-designer";

interface Props {
  id?: string;
}

const props = defineProps<Props>();
const router = useRouter();

const component = ref<ComponentDef>({
  id: uid("field_"),
  type: "Input",
  field: "",
  label: "",
});
const lastSavedJson = ref<string>("");
const lastSavedRecord = ref<string>("");
const jsonModalOpen = ref(false);

// 解析所有 IndicatorRecord → ComponentDef[] 供 FormDesigner 使用
const items = computed(() => demoFields.map(parseComponent));

onMounted(() => {
  if (props.id) {
    const record = demoFields.find((r) => r.indicatorId === props.id);
    if (record) component.value = parseComponent(record);
  }
});

function onUpdate(c: ComponentDef | FormTemplate) {
  if ("type" in c && "field" in c) component.value = c as ComponentDef;
}

function onSave(c: ComponentDef | FormTemplate | any[]) {
  if (Array.isArray(c)) return;
  const def = ("type" in c && "field" in c ? c : null) as ComponentDef | null;
  if (!def) return;

  // 正向：ComponentDef JSON（前端格式，存 fieldComponentFrontJson）
  const defJson = JSON.stringify(def, null, 2);
  lastSavedJson.value = defJson;

  // 反向：ComponentDef → IndicatorRecord（后端接口参数）
  const record = toIndicatorRecord(def);
  const recordJson = JSON.stringify(record, null, 2);
  lastSavedRecord.value = recordJson;

  jsonModalOpen.value = true;

  console.log("[FieldEditor] ========== 保存字段 ==========");
  console.log("[FieldEditor] 前端格式（ComponentDef → fieldComponentFrontJson）：");
  console.log(JSON.parse(defJson));
  console.log("[FieldEditor] 后端格式（IndicatorRecord → POST 接口参数）：");
  console.log(JSON.parse(recordJson));
}

function copyJson() {
  if (!lastSavedRecord.value) return;
  navigator.clipboard?.writeText(lastSavedRecord.value);
}

function onCancel() {
  if (window.history.length > 1) router.back();
  else router.push("/fields");
}

function onPreview(c: ComponentDef | FormTemplate | any[]) {
  if (Array.isArray(c)) return;
  const def = c as ComponentDef;
  const tpl: FormTemplate = { id: "preview", components: [def] };
  sessionStorage.setItem(
    "__preview_template__",
    JSON.stringify({ id: "preview", tpl }),
  );
  const url = router.resolve("/templates/preview/render");
  window.open(url.href, "_blank");
}
</script>

<template>
  <div class="field-editor">
    <div class="editor-header">
      <a-button @click="onCancel">← 返回</a-button>
      <h1>{{ id ? "编辑小项目" : "新建小项目" }}</h1>
    </div>

    <a-modal
      v-model:open="jsonModalOpen"
      title="保存预览"
      :footer="null"
      width="720"
    >
      <a-tabs size="small">
        <a-tab-pane key="frontend" tab="前端格式（ComponentDef）">
          <pre class="json-modal-pre">{{ lastSavedJson }}</pre>
        </a-tab-pane>
        <a-tab-pane key="backend" tab="后端格式（IndicatorRecord）">
          <pre class="json-modal-pre">{{ lastSavedRecord }}</pre>
        </a-tab-pane>
      </a-tabs>
      <a-button type="primary" @click="copyJson">复制</a-button>
    </a-modal>

    <FormDesigner
      mode="field"
      :item="component"
      :items="items"
      @update:item="onUpdate"
      @save="onSave"
      @cancel="onCancel"
      @preview="onPreview"
    />
  </div>
</template>

<style scoped>
.field-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.editor-header h1 {
  margin: 0;
  font-size: 18px;
}
.json-modal-pre {
  max-height: 400px;
  overflow: auto;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  font-family: "SF Mono", Menlo, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  margin-bottom: 12px;
}
</style>
