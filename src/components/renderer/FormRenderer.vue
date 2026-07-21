<template>
  <div v-if="template" class="vf-form">
    <a-table
      :data-source="tableRows"
      :columns="tableColumns"
      :pagination="false"
      :row-key="(row: any) => row.key"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'label'">
          <span :class="{ required: record.required }">{{ record.label }}</span>
        </template>
        <template v-else-if="column.key === 'value'">
          <div v-if="record.comp" class="vf-value-cell">
            <FieldPreview
              :component="record.comp"
              :value="values[record.comp.id]"
              :dynamic-style="record.dynamicStyle"
              :classes="record.classes"
              :disabled="record.disabled"
              :show-unit="false"
              @change="(v: any) => onValueChange(record.comp.id, v)"
            />
            <span v-if="record.suffix" class="vf-suffix-inline">{{
              record.suffix
            }}</span>
            <span v-if="errors[record.comp.id]" class="vf-error">{{
              errors[record.comp.id]
            }}</span>
          </div>
        </template>
        <template v-else-if="column.key === 'unit'">
          <span v-if="record.meta?.unit" class="vf-unit">{{
            record.meta.unit
          }}</span>
        </template>
        <template v-else-if="column.key === 'range'">
          <span v-if="record.meta?.range" class="vf-range">{{
            record.meta.range
          }}</span>
        </template>
      </template>
    </a-table>

    <div v-if="!hideSubmit" class="vf-actions">
      <a-space>
        <a-button type="primary" @click="onSubmit">提交</a-button>
        <a-button @click="onReset">重置</a-button>
        <a-button v-if="showPreviewJson" @click="onShowJson"
          >查看 JSON</a-button
        >
      </a-space>
    </div>

    <a-modal
      v-model:open="jsonVisible"
      title="收集到的数据"
      width="600px"
      :footer="null"
    >
      <pre class="json-preview">{{
        JSON.stringify(submittedData, null, 2)
      }}</pre>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import type {
  ComponentDef,
  FormTemplate,
  ValidationParams,
} from "@/types/template";
import { RuleEngine } from "./engine/RuleEngine";
import {
  createDefaultState,
  patchState,
  type FieldState,
} from "./engine/ActionApplier";
import FieldPreview from "@/components/designer/FieldPreview.vue";

const props = defineProps<{
  template: FormTemplate;
  hideSubmit?: boolean;
  showPreviewJson?: boolean;
  initialValues?: Record<string, any>;
}>();

interface TableRow {
  key: string;
  label: string;
  suffix?: string;
  required?: boolean;
  disabled?: boolean;
  dynamicStyle?: Record<string, string>;
  classes?: string[];
  comp?: ComponentDef;
  meta?: FieldMeta;
}

interface FieldMeta {
  unit?: string;
  range?: string;
}

const values = reactive<Record<string, any>>({});
const states = reactive<Record<string, FieldState>>({});
const errors = reactive<Record<string, string | undefined>>({});
const submittedData = ref<any>({});
const jsonVisible = ref(false);

let engine: RuleEngine | null = null;

const allComponents = computed(() => props.template.components);

/**
 * 提取字段元信息（单位、参考范围）
 */
const getFieldMeta = (comp: ComponentDef): FieldMeta => {
  const meta: FieldMeta = {};
  if (comp.unit) meta.unit = comp.unit;
  // 参考范围优先取 props.min/max
  const min = comp.props?.min;
  const max = comp.props?.max;
  if (min != null && max != null) {
    meta.range = `${min} ~ ${max}`;
  } else if (min != null) {
    meta.range = `≥ ${min}`;
  } else if (max != null) {
    meta.range = `≤ ${max}`;
  }
  // 没有 props 时从 validation 规则推导
  if (!meta.range) {
    let vMin: number | undefined;
    let vMax: number | undefined;
    for (const rule of comp.rules) {
      if (!rule.enabled || rule.type !== "validation") continue;
      for (const v of (rule.params as any).validators || []) {
        if (v.type === "min" && v.value != null) vMin = Number(v.value);
        if (v.type === "max" && v.value != null) vMax = Number(v.value);
      }
    }
    if (vMin !== undefined && vMax !== undefined)
      meta.range = `${vMin} ~ ${vMax}`;
    else if (vMin !== undefined) meta.range = `≥ ${vMin}`;
    else if (vMax !== undefined) meta.range = `≤ ${vMax}`;
  }
  return meta;
};

/**
 * 把模板 components 转为 Table 行。
 * 条件显隐规则隐藏的字段整体跳过。
 */
const tableRows = computed<TableRow[]>(() => {
  const rows: TableRow[] = [];
  for (const comp of props.template.components) {
    if (states[comp.id]?.visible === false) continue;
    rows.push({
      key: `field_${comp.id}`,
      label: comp.label,
      comp,
      suffix: states[comp.id]?.suffix,
      required: states[comp.id]?.required ?? !!comp.required,
      disabled: !!states[comp.id]?.autoCalculated,
      dynamicStyle: states[comp.id]?.style,
      classes: states[comp.id]?.classes,
      meta: getFieldMeta(comp),
    });
  }
  return rows;
});

const tableColumns = [
  { key: "label", title: "字段", width: "22%" },
  { key: "value", title: "结果" },
  { key: "unit", title: "单位", width: "12%" },
  { key: "range", title: "参考范围", width: "18%" },
];

const isRequired = (comp: ComponentDef) => {
  if (states[comp.id]?.required) return true;
  return !!comp.required;
};

const initState = () => {
  for (const c of allComponents.value) {
    const iv = props.initialValues;
    const fromInitial =
      iv && Object.prototype.hasOwnProperty.call(iv, c.field)
        ? iv[c.field]
        : undefined;
    values[c.id] = fromInitial !== undefined ? fromInitial : c.defaultValue;
    states[c.id] = createDefaultState();
    if (c.required) states[c.id]!.required = true;
    errors[c.id] = undefined;
  }
};

const setFieldState = (id: string, patch: any) => {
  if (!states[id]) states[id] = createDefaultState();
  states[id] = patchState(states[id], patch);
};

const onValueChange = (id: string, v: any) => {
  if (states[id]?.autoCalculated && v !== values[id]) return;
  values[id] = v;
  errors[id] = undefined;
  engine?.onValueChange(id, v);
  validateField(id);
};

const validateField = (id: string) => {
  const comp = allComponents.value.find((c) => c.id === id);
  if (!comp) return;
  const v = values[id];
  if (isRequired(comp) && (v === undefined || v === null || v === "")) {
    errors[id] = `${comp.label}不能为空`;
    return;
  }
  for (const rule of comp.rules) {
    if (!rule.enabled || rule.type !== "validation") continue;
    const p = rule.params as ValidationParams;
    for (const validator of p.validators || []) {
      if (
        validator.type === "required" &&
        (v === undefined || v === null || v === "")
      ) {
        errors[id] = validator.message;
        return;
      }
      if (
        validator.type === "min" &&
        v !== undefined &&
        Number(v) < Number(validator.value)
      ) {
        errors[id] = validator.message;
        return;
      }
      if (
        validator.type === "max" &&
        v !== undefined &&
        Number(v) > Number(validator.value)
      ) {
        errors[id] = validator.message;
        return;
      }
      if (
        validator.type === "minLength" &&
        v !== undefined &&
        v !== null &&
        String(v).length < Number(validator.value)
      ) {
        errors[id] = validator.message;
        return;
      }
      if (
        validator.type === "maxLength" &&
        v !== undefined &&
        v !== null &&
        String(v).length > Number(validator.value)
      ) {
        errors[id] = validator.message;
        return;
      }
      if (
        validator.type === "regex" &&
        v !== undefined &&
        v !== "" &&
        validator.pattern
      ) {
        try {
          if (!new RegExp(validator.pattern).test(String(v))) {
            errors[id] = validator.message;
            return;
          }
        } catch {
          /* invalid regex, skip */
        }
      }
    }
  }
};

const onSubmit = () => {
  let hasError = false;
  for (const c of allComponents.value) {
    validateField(c.id);
    if (errors[c.id]) hasError = true;
  }
  if (hasError) {
    message.error("请修正标红字段后再提交");
    return;
  }
  const data: Record<string, any> = {};
  for (const c of allComponents.value) {
    data[c.field] = values[c.id];
  }
  submittedData.value = data;
  jsonVisible.value = true;
  console.log("[FormRenderer] 提交数据：", data);
};

const onShowJson = () => {
  const data: Record<string, any> = {};
  for (const c of allComponents.value) {
    data[c.field] = values[c.id];
  }
  submittedData.value = data;
  jsonVisible.value = true;
};

const onReset = () => {
  initState();
  engine?.runInit();
};

onMounted(() => {
  initState();
  engine = new RuleEngine({
    components: allComponents.value,
    values: new Map(Object.entries(values)),
    setFieldState,
  });
  engine.onCalculationValue = (id, v) => {
    states[id] = {
      ...(states[id] || createDefaultState()),
      autoCalculated: true,
    };
    values[id] = v;
    engine?.onValueChange(id, v);
  };
  engine.runInit();
});

watch(
  () => props.template,
  () => {
    initState();
    engine?.runInit();
  },
);
</script>

<style scoped>
.vf-form {
  padding: 4px 0;
}
.vf-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
.json-preview {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
  margin: 0;
}

/* 表格单元格：字段列右对齐 + 浅灰底 */
.vf-form :deep(.ant-table-tbody > tr > td:first-child) {
  text-align: right;
  font-weight: 500;
  color: #1f2937;
  background: #fafafa;
}
.vf-form :deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}
/* 表头：字段/结果/单位/参考范围 */
.vf-form :deep(.ant-table-thead > tr > th) {
  text-align: center;
  background: #f5f5f5;
  font-weight: 600;
}
.vf-form :deep(.ant-table-thead > tr > th:first-child) {
  text-align: right;
}
/* 必填红星 */
.vf-form :deep(.required::before) {
  content: "*";
  color: #ef4444;
  margin-right: 4px;
}
/* 结果列单元格（控件 + 后缀 + 错误） */
.vf-value-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.vf-suffix-inline {
  color: #f5222d;
  font-size: 12px;
  padding: 1px 8px;
  background: #fff1f0;
  border-radius: 10px;
  white-space: nowrap;
}
.vf-error {
  color: #f5222d;
  font-size: 12px;
}
/* 单位列 */
.vf-unit {
  color: #6b7280;
  font-size: 13px;
  display: inline-block;
  width: 100%;
  text-align: center;
}
/* 参考范围列 */
.vf-range {
  color: #6b7280;
  font-size: 13px;
  display: inline-block;
  width: 100%;
  text-align: center;
}
</style>
