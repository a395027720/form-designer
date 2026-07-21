<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    class="fd-input fd-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxLength"
    :rows="rows ?? 4"
    @input="onInput"
  />
</template>

<style scoped>
.fd-textarea {
  height: auto;
  padding: 4px 11px;
  resize: vertical;
  min-height: 32px;
}
</style>
