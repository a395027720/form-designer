<template>
  <div class="rule-editor">
    <a-form layout="vertical" size="small">
      <a-form-item label="规则名称">
        <a-input v-model:value="local.name" placeholder="如：白细胞必填且为正数" />
      </a-form-item>

      <a-divider style="margin: 12px 0">校验项</a-divider>

      <div v-for="(v, i) in local.params.validators" :key="i" class="validator-row">
        <a-select v-model:value="v.type" style="width: 110px" @change="onTypeChange(v)">
          <a-select-option value="required">必填</a-select-option>
          <a-select-option value="min">最小值</a-select-option>
          <a-select-option value="max">最大值</a-select-option>
          <a-select-option value="minLength">最短长度</a-select-option>
          <a-select-option value="maxLength">最长长度</a-select-option>
          <a-select-option value="regex">正则</a-select-option>
        </a-select>
        <a-input-number
          v-if="['min','max','minLength','maxLength'].includes(v.type)"
          v-model:value="(v as any).value"
          style="width: 100px"
        />
        <a-input
          v-if="v.type === 'regex'"
          v-model:value="(v as any).pattern"
          placeholder="正则表达式"
          style="width: 160px"
        />
        <a-input
          v-model:value="v.message"
          placeholder="错误提示文案"
          style="flex: 1"
        />
        <a-button size="small" type="text" danger @click="remove(i)">✕</a-button>
      </div>
      <a-button size="small" block @click="add">+ 添加校验项</a-button>

      <div class="text-muted" style="font-size: 12px; margin-top: 12px; line-height: 1.6">
        💡 如果组件本身已勾选「必填」，会自动生成一条必填校验，无需重复添加
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { RuleDef, ValidationValidator } from '@/types/template'
import { uid } from '@/utils/uid'

const props = defineProps<{ rule?: RuleDef }>()
const emit = defineEmits<{ 'update:rule': [RuleDef] }>()

const local = reactive<RuleDef>(props.rule ? JSON.parse(JSON.stringify(props.rule)) : {
  id: uid('rule_'),
  type: 'validation',
  name: '校验规则',
  enabled: true,
  trigger: 'onBlur',
  params: { validators: [] as ValidationValidator[] }
})

const add = () => {
  if (!local.params.validators) {
    local.params.validators = []
  }
  local.params.validators.push({ type: 'required', message: '此项必填' } as ValidationValidator)
}

const remove = (i: number) => {
  if (!local.params.validators) return
  local.params.validators.splice(i, 1)
}

const DEFAULT_MESSAGES: Record<string, string> = {
  required: '此项必填',
  min: '不能小于最小值',
  max: '不能大于最大值',
  minLength: '长度不能小于最短长度',
  maxLength: '长度不能超过最长长度',
  regex: '格式不正确'
}

const onTypeChange = (_v: ValidationValidator) => {
  // 切换类型时重置 value/pattern
  delete (_v as any).value
  delete (_v as any).pattern
  // 若 message 仍是某个类型的默认文案（用户未自定义），同步为新类型默认文案
  if (!_v.message || Object.values(DEFAULT_MESSAGES).includes(_v.message)) {
    _v.message = DEFAULT_MESSAGES[_v.type] || ''
  }
}

watch(local, () => emit('update:rule', JSON.parse(JSON.stringify(local))), { deep: true })
</script>

<style scoped>
.validator-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
</style>