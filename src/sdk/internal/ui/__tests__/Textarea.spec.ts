import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Textarea from '../Textarea.vue'

describe('Textarea', () => {
  it('renders as textarea element', () => {
    const wrapper = mount(Textarea, { props: { modelValue: '' } })
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(Textarea, { props: { modelValue: '' } })
    await wrapper.find('textarea').setValue('multi\nline')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['multi\nline'])
  })

  it('respects rows', () => {
    const wrapper = mount(Textarea, { props: { rows: 5 } })
    expect(wrapper.find('textarea').attributes('rows')).toBe('5')
  })

  it('respects maxLength', () => {
    const wrapper = mount(Textarea, { props: { maxLength: 100 } })
    expect(wrapper.find('textarea').attributes('maxlength')).toBe('100')
  })
})
