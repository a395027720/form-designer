<template>
  <div class="rule-list">
    <div class="rule-list-header">
      <span class="text-muted">{{ headerText }}</span>
      <a-button size="small" type="primary" @click="wizardOpen = true">
        + 新增{{ type === 'validation' ? '校验' : '规则' }}
      </a-button>
    </div>

    <a-empty v-if="rules.length === 0" :description="emptyText" />

    <div v-else class="rule-items">
      <div v-for="r in rules" :key="r.id" class="rule-item">
        <div class="rule-item-head">
          <a-switch v-model:checked="r.enabled" size="small" />
          <span class="rule-name">{{ r.name || '未命名规则' }}</span>
          <a-tag :color="ruleColor(r.type)" size="small">{{ ruleTypeLabel(r.type) }}</a-tag>
          <a-button size="small" type="text" @click="onEdit(r)">编辑</a-button>
          <a-button size="small" type="text" danger @click="onDelete(r.id)">✕</a-button>
        </div>
        <div class="rule-desc">{{ describeRule(r, template?.components || []) }}</div>
      </div>
    </div>

    <RuleWizard
      v-model:open="wizardOpen"
      :component="component"
      :components="template?.components || []"
      :rule-type-filter="type === 'validation' ? ['validation'] : ['calculation', 'threshold', 'comparison', 'conditional']"
      :mode="editingRule ? 'edit' : 'create'"
      :edit-rule="editingRule"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTemplateStore } from '@/stores/templateStore'
import type { ComponentDef, RuleDef } from '@/types/template'
import { describeRule, ruleTypeLabel } from '@/utils/describe'
import RuleWizard from './RuleWizard.vue'

const props = defineProps<{ component: ComponentDef; type: 'validation' | 'business' }>()

const store = useTemplateStore()
const template = computed(() => store.template)
const wizardOpen = ref(false)
const editingRule = ref<RuleDef | null>(null)

const rules = computed(() =>
  props.component.rules.filter(r => props.type === 'validation' ? r.type === 'validation' : r.type !== 'validation')
)

const headerText = computed(() =>
  props.type === 'validation' ? '校验规则（控制能否提交）' : '业务规则（动态计算与联动）'
)
const emptyText = computed(() =>
  props.type === 'validation' ? '暂无校验规则，点上方新增' : '暂无业务规则，点上方新增'
)

const ruleColor = (type: RuleDef['type']) =>
  ({ calculation: 'purple', threshold: 'orange', comparison: 'gold', conditional: 'cyan', validation: 'green' }[type])

const onDelete = (ruleId: string) => {
  store.removeRule(props.component.id, ruleId)
}

const onEdit = (rule: RuleDef) => {
  editingRule.value = JSON.parse(JSON.stringify(rule))
  wizardOpen.value = true
}

// 弹窗关闭（取消/关闭）时清掉编辑状态，避免下次打开误入编辑模式
watch(wizardOpen, (v) => {
  if (!v) editingRule.value = null
})

const onConfirm = (rule: RuleDef, mode: 'create' | 'edit') => {
  if (mode === 'edit') {
    store.updateRule(props.component.id, rule.id, rule)
  } else {
    store.addRule(props.component.id, rule)
  }
  editingRule.value = null
}
</script>

<style scoped>
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rule-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.rule-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rule-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fafafa;
}
.rule-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rule-name {
  flex: 1;
  font-weight: 500;
}
.rule-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.5;
}
</style>