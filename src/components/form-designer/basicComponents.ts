import type { BasicComponentType, ComponentDef } from './types'

export interface BasicComponentMeta {
  type: BasicComponentType
  label: string
  defaultProps: Partial<ComponentDef>
}

export const BASIC_COMPONENTS: BasicComponentMeta[] = [
  {
    type: 'Input',
    label: '输入框',
    defaultProps: { type: 'Input', field: '', label: '输入框', required: false }
  },
  {
    type: 'Textarea',
    label: '多行文本',
    defaultProps: { type: 'Textarea', field: '', label: '多行文本', required: false }
  },
  {
    type: 'InputNumber',
    label: '数字输入',
    defaultProps: { type: 'InputNumber', field: '', label: '数字输入', required: false }
  },
  {
    type: 'Select',
    label: '下拉选择',
    defaultProps: { type: 'Select', field: '', label: '下拉选择', required: false, props: { options: [] } }
  },
  {
    type: 'RadioGroup',
    label: '单选组',
    defaultProps: { type: 'RadioGroup', field: '', label: '单选组', required: false, props: { options: [] } }
  },
  {
    type: 'CheckboxGroup',
    label: '多选组',
    defaultProps: { type: 'CheckboxGroup', field: '', label: '多选组', required: false, props: { options: [] } }
  },
  {
    type: 'DatePicker',
    label: '日期选择',
    defaultProps: { type: 'DatePicker', field: '', label: '日期选择', required: false }
  },
  {
    type: 'TimePicker',
    label: '时间选择',
    defaultProps: { type: 'TimePicker', field: '', label: '时间选择', required: false }
  },
  {
    type: 'Switch',
    label: '开关',
    defaultProps: { type: 'Switch', field: '', label: '开关', required: false }
  },
  {
    type: 'DisplayText',
    label: '展示文本',
    defaultProps: { type: 'DisplayText', field: '', label: '展示文本' }
  },
  {
    type: 'Upload',
    label: '文件上传',
    defaultProps: {
      type: 'Upload', field: '', label: '文件上传',
      props: {
        accept: 'image/*',
        maxCount: 5,
        listType: 'picture-card',
        maxSize: 10
      }
    }
  }
]

export function getBasicComponentByType(type: string): BasicComponentMeta | undefined {
  return BASIC_COMPONENTS.find(c => c.type === type)
}
