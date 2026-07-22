<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentDef, RuleDef } from '../../types'
import { describeRule, ruleTypeLabel } from '../../utils/describe'
import RuleWizard from './RuleWizard.vue'

const props = defineProps<{
  component: ComponentDef
  components: ComponentDef[]
  type: 'validation' | 'business'
  /** 只读模式：仅可查看规则，不可新增/编辑/删除/开关（presets 模式用） */
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'addRule', componentId: string, rule: RuleDef): void
  (e: 'updateRule', componentId: string, ruleId: string, patch: Partial<RuleDef>): void
  (e: 'removeRule', componentId: string, ruleId: string): void
}>()

const wizardOpen = ref(false)
const editingRule = ref<RuleDef | null>(null)

const rules = computed(() =>
  (props.component.rules ?? []).filter(r =>
    props.type === 'validation' ? r.type === 'validation' : r.type !== 'validation'
  )
)

const headerText = computed(() =>
  props.type === 'validation' ? '校验规则（控制能否提交）' : '业务规则（动态计算与联动）'
)
const emptyText = computed(() =>
  props.type === 'validation' ? '暂无校验规则' : '暂无业务规则'
)

function onToggle(rule: RuleDef, v: boolean) {
  emit('updateRule', props.component.id, rule.id, { enabled: v })
}

function onDelete(ruleId: string) {
  emit('removeRule', props.component.id, ruleId)
}

function onEdit(rule: RuleDef) {
  editingRule.value = JSON.parse(JSON.stringify(rule))
  wizardOpen.value = true
}

watch(wizardOpen, (v) => {
  if (!v) editingRule.value = null
})

function onConfirm(rule: RuleDef, mode: 'create' | 'edit') {
  if (mode === 'edit') {
    emit('updateRule', props.component.id, rule.id, rule)
  } else {
    emit('addRule', props.component.id, rule)
  }
  editingRule.value = null
}
</script>

<template>
  <div class="rule-list">
    <div class="rule-list-header">
      <span class="text-muted header-text">{{ headerText }}</span>
      <a-button v-if="!readonly" size="small" type="primary" @click="wizardOpen = true">
        + 新增{{ type === 'validation' ? '校验' : '规则' }}
      </a-button>
    </div>

    <div v-if="rules.length === 0" class="rule-empty">{{ emptyText }}</div>

    <div v-else class="rule-items">
      <div v-for="r in rules" :key="r.id" class="rule-item">
        <!-- 第一行：开关 + 名称 + 标签 -->
        <div class="rule-row1">
          <a-switch size="small" :checked="r.enabled" :disabled="readonly" @update:checked="(v: boolean) => onToggle(r, v)" />
          <span class="rule-name">{{ r.name || '未命名规则' }}</span>
          <span class="rule-tag" :class="`tag-${r.type}`">{{ ruleTypeLabel(r.type) }}</span>
        </div>
        <!-- 第二行：描述 + 操作 -->
        <div class="rule-row2">
          <span class="rule-desc">{{ describeRule(r, components) }}</span>
          <div class="rule-actions">
            <a-button size="small" type="link" @click="onEdit(r)">{{ readonly ? '查看' : '编辑' }}</a-button>
            <a-button v-if="!readonly" size="small" type="link" danger @click="onDelete(r.id)">删除</a-button>
          </div>
        </div>
      </div>
    </div>

    <RuleWizard
      v-model:open="wizardOpen"
      :component="component"
      :components="components"
      :rule-type-filter="type === 'validation' ? ['validation'] : ['calculation', 'threshold', 'comparison', 'conditional']"
      :mode="editingRule ? 'edit' : 'create'"
      :edit-rule="editingRule"
      :readonly="readonly"
      @confirm="onConfirm"
    />
  </div>
</template>

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
  font-size: 12px;
  gap: 8px;
}
/* header 描述最多展示 2 行 */
.header-text {
  flex: 1;
  min-width: 0;
  color: #94a3b8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.text-muted { color: #94a3b8; }
.rule-empty {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-size: 13px;
}
.rule-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rule-item {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fff;
  transition: box-shadow 0.2s;
}
.rule-item:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.rule-row1 {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.rule-name {
  flex: 1;
  font-weight: 500;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.rule-tag {
  font-size: 11px;
  padding: 0 6px;
  line-height: 18px;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
}
.tag-calculation { background: #f9f0ff; border-color: #d3adf7; color: #722ed1; }
.tag-threshold { background: #fff7e6; border-color: #ffd591; color: #d46b08; }
.tag-comparison { background: #fffbe6; border-color: #ffe58f; color: #d48806; }
.tag-conditional { background: #e6fffb; border-color: #87e8de; color: #08979c; }
.tag-validation { background: #f6ffed; border-color: #b7eb8f; color: #389e0d; }
.rule-row2 {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4px;
  margin-top: 4px;
}
.rule-desc {
  flex: 1;
  font-size: 11px;
  color: #999;
  line-height: 1.4;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.rule-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
</style>
