<template>
  <div class="designer-page" v-if="store.template">
    <header class="page-header designer-header">
      <a-space>
        <a-button @click="onBack">← 返回</a-button>
        <a-input
          v-model:value="nameValue"
          style="width: 260px; font-weight: 600"
          @blur="onMetaBlur"
        />
        <a-select
          v-model:value="categoryValue"
          style="width: 120px"
          @change="onMetaBlur"
        >
          <a-select-option v-for="c in categories" :key="c" :value="c">{{
            c
          }}</a-select-option>
        </a-select>
      </a-space>

      <a-space>
        <a-button @click="onPreview">预览</a-button>
        <a-button @click="onExport">导出 JSON</a-button>
        <a-button type="primary" @click="onSave">保存模板</a-button>
      </a-space>
    </header>

    <main class="designer-body">
      <aside class="designer-aside left">
        <ComponentLibrary />
      </aside>

      <section class="designer-canvas-area">
        <DesignerCanvas
          :selected-id="store.selectedComponentId"
          @select="onSelect"
          @preview="onPreview"
        />
      </section>

      <aside v-if="store.selectedComponentId" class="designer-aside right">
        <PropertyPanel />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { useTemplateStore } from "@/stores/templateStore";
import { templateApi } from "@/api/templateApi";
import ComponentLibrary from "@/components/designer/ComponentLibrary.vue";
import DesignerCanvas from "@/components/designer/DesignerCanvas.vue";
import PropertyPanel from "@/components/designer/PropertyPanel.vue";

const route = useRoute();
const router = useRouter();
const store = useTemplateStore();

const nameValue = ref("");
const categoryValue = ref("");

const categories = [
  "血液检查",
  "尿液检查",
  "生化检查",
  "肝功能",
  "肾功能",
  "影像检查",
  "其他",
];

watch(
  () => store.template,
  (t) => {
    if (t) {
      nameValue.value = t.name;
      categoryValue.value = t.category;
    }
  },
  { immediate: true },
);

const onMetaBlur = () => {
  if (!store.template) return;
  store.updateTemplateMeta({
    name: nameValue.value,
    category: categoryValue.value || "其他",
  });
};

const onSelect = (id: string) => {
  store.selectedComponentId = id;
};

const onSave = () => {
  onMetaBlur();
  store.save();
  message.success("模板已保存");
};

const onPreview = () => {
  if (!store.template) return;
  // 暂存到内存（不写入存储），跳到渲染器
  localStorage.setItem("__preview_template__", JSON.stringify(store.template));
  const url = router.resolve(`/renderer/${store.template.id}`);
  window.open(url.href, "_blank");
};

const onExport = () => {
  if (!store.template) return;
  templateApi.exportObject(store.template);
  message.success("已导出 JSON");
};

const onBack = () => {
  if (confirm("确定离开？未保存的修改会丢失。")) {
    router.push("/templates");
  }
};

onMounted(() => {
  const id = route.params.id as string;
  try {
    store.load(id);
  } catch (e: any) {
    message.error(e.message);
    router.push("/templates");
  }
});
</script>

<style scoped>
.designer-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.designer-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 16px;
  height: 56px;
}
.designer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.designer-aside {
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.designer-aside.left {
  width: 260px;
  border-right: 1px solid #f0f0f0;
}
.designer-aside.right {
  width: 380px;
  border-left: 1px solid #f0f0f0;
}
.designer-canvas-area {
  flex: 1;
  overflow: hidden;
}
</style>
