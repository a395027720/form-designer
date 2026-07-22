<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { templateApi } from "@/api/templateApi";
import { FormDesigner } from "@/components/form-designer";
import type { FormTemplate, ComponentDef } from "@/components/form-designer";

interface Props {
  id?: string;
}

const props = defineProps<Props>();
const router = useRouter();

const component = ref<FormTemplate>();
const lastSavedJson = ref<string>("");
const jsonModalOpen = ref(false);

onMounted(() => {
  if (props.id) {
    const existing = templateApi.get(props.id);
    if (existing) component.value = JSON.parse(JSON.stringify(existing));
  }
});

function onSave(t: ComponentDef | FormTemplate | any[]) {
  if (Array.isArray(t)) return;
  const tpl = ("components" in t ? t : null) as FormTemplate | null;
  if (!tpl) return;
  lastSavedJson.value = JSON.stringify(tpl, null, 2);
  jsonModalOpen.value = true;
  console.log("[BasicEditor] ========== 保存模板 ==========");
  console.log("[BasicEditor] 模板 ID：", tpl.id);
  console.log("[BasicEditor] 字段数量：", tpl.components.length);
  console.log("[BasicEditor] 完整模板 JSON：", JSON.parse(JSON.stringify(tpl)));
}

function copyJson() {
  if (!lastSavedJson.value) return;
  navigator.clipboard?.writeText(lastSavedJson.value);
}

function onCancel() {
  if (window.history.length > 1) router.back();
  else router.push("/templates");
}

function onPreview(t: ComponentDef | FormTemplate | any[]) {
  if (Array.isArray(t)) return;
  const tpl = ("components" in t ? t : null) as FormTemplate | null;
  if (!tpl) return;
  sessionStorage.setItem(
    "__preview_template__",
    JSON.stringify({ id: tpl.id || "preview", tpl }),
  );
  const url = router.resolve(`/templates/${tpl.id || "preview"}/render`);
  window.open(url.href, "_blank");
}
</script>

<template>
  <div class="template-editor">
    <div class="editor-header">
      <a-button @click="onCancel">← 返回</a-button>
      <h1>{{ id ? "编辑模板" : "新建模板 — 自由设计" }}</h1>
    </div>

    <a-modal
      v-model:open="jsonModalOpen"
      title="模板 JSON"
      :footer="null"
      width="640"
    >
      <pre class="json-modal-pre">{{ lastSavedJson }}</pre>
      <a-button type="primary" @click="copyJson">复制</a-button>
    </a-modal>

    <FormDesigner
      mode="basic"
      :item="component"
      @save="onSave"
      @cancel="onCancel"
      @preview="onPreview"
    />
  </div>
</template>

<style scoped>
.template-editor {
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
