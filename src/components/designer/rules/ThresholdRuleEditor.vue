<template>
  <div class="rule-editor">
    <a-form layout="vertical" size="small">
      <a-form-item label="规则名称">
        <a-input v-model:value="local.name" placeholder="如：白细胞分级" />
      </a-form-item>

      <a-divider style="margin: 12px 0">分级区间</a-divider>

      <div v-for="(r, i) in local.params.ranges" :key="i" class="range-row">
        <a-tag :color="r.color" style="margin-right: 8px">{{ r.label || '未命名' }}</a-tag>
        <a-input-number v-model:value="r.min" placeholder="最小值（留空=无下限）" size="small" />
        <span>~</span>
        <a-input-number v-model:value="r.max" placeholder="最大值（留空=无上限）" size="small" />
        <a-input v-model:value="r.label" placeholder="显示标签" size="small" style="width: 100px" />
        <a-input v-model:value="r.color" placeholder="颜色" size="small" style="width: 90px" />
        <a-button size="small" type="text" danger @click="remove(i)">✕</a-button>
      </div>
      <a-button size="small" block @click="add">+ 添加区间</a-button>

      <a-divider style="margin: 16px 0">副作用</a-divider>
      <a-checkbox v-model:checked="enableStyle">异常时改变字段颜色</a-checkbox>
      <a-checkbox v-model:checked="enableText">异常时附加标签文字</a-checkbox>

      <div class="text-muted" style="font-size: 12px; margin-top: 8px; line-height: 1.6">
        触发时机：值变化时自动判定所属区间并应用样式
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { RuleDef, ThresholdRange } from '@/types/template'
import { uid } from '@/utils/uid'

const props = defineProps<{ rule?: RuleDef }>()
const emit = defineEmits<{ 'update:rule': [RuleDef] }>()

const local = reactive<RuleDef>(
  (() => {
    // 已有区间（编辑模式）→ 深拷贝保留；空区间（新增模式）→ 用默认 3 区间
    if (props.rule && props.rule.params?.ranges && props.rule.params.ranges.length > 0) {
      return JSON.parse(JSON.stringify(props.rule))
    }
    return {
      id: uid('rule_'),
      type: 'threshold',
      name: '阈值分级',
      enabled: true,
      trigger: 'onChange',
      params: {
        ranges: [
          { min: null, max: 4, label: '偏低', level: 'low', color: '#52c41a' },
          { min: 4, max: 10, label: '正常', level: 'normal', color: '#1890ff' },
          { min: 10, max: null, label: '偏高', level: 'high', color: '#f5222d' }
        ] as ThresholdRange[],
        actions: []
      }
    }
  })()
)

const hasAction = (type: string) =>
  (props.rule?.params as any)?.actions?.some((a: any) => a.type === type) ?? false

const enableStyle = ref(props.rule?.params ? hasAction('setStyle') : true)
const enableText = ref(props.rule?.params ? hasAction('setText') : true)

const emitUpdate = () => {
  const actions: any[] = []
  if (enableStyle.value) actions.push({ type: 'setStyle', target: '$.self', style: { color: '$color' } })
  if (enableText.value) actions.push({ type: 'setText', target: '$.self.suffix', value: '$label' })
  local.params.actions = actions
  emit('update:rule', JSON.parse(JSON.stringify(local)))
}

const add = () => {
  local.params.ranges.push({ min: 0, max: 0, label: '新区间', level: 'normal', color: '#1890ff' })
  emitUpdate()
}

const remove = (i: number) => {
  local.params.ranges.splice(i, 1)
  emitUpdate()
}

// checkbox 改变时同步副作用 actions
watch([enableStyle, enableText], () => emitUpdate())
// 区间值/标签/颜色等输入变化时同步到 wizard
watch(() => local, () => emit('update:rule', JSON.parse(JSON.stringify(local))), { deep: true })
</script>

<style scoped>
.range-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.range-row > * {
  flex: 1;
}
.range-row > .ant-btn {
  flex: 0;
}
</style>