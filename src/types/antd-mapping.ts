import type { BasicComponentType as ComponentType } from '@/components/form-designer'

/** 组件库分组 */
export interface ComponentLibraryItem {
  type: ComponentType
  label: string
  group: '基础输入' | '选择' | '日期时间' | '特殊' | '布局容器'
  description: string
  icon: string
  defaultProps?: Record<string, any>
  defaultOptions?: { label: string; value: string | number }[]
}

export const COMPONENT_LIBRARY: ComponentLibraryItem[] = [
  {
    type: 'Input',
    label: '单行文本',
    group: '基础输入',
    description: '普通文本输入',
    icon: '📝',
    defaultProps: { placeholder: '请输入', maxLength: 100 }
  },
  {
    type: 'Textarea',
    label: '多行文本',
    group: '基础输入',
    description: '多行文本描述',
    icon: '📄',
    defaultProps: { rows: 4, placeholder: '请输入' }
  },
  {
    type: 'InputNumber',
    label: '数值',
    group: '基础输入',
    description: '数字输入（医学检查项常用）',
    icon: '🔢',
    defaultProps: { placeholder: '请输入数值' }
  },
  {
    type: 'Select',
    label: '下拉选择',
    group: '选择',
    description: '下拉单选',
    icon: '📋',
    defaultProps: { placeholder: '请选择' },
    defaultOptions: [
      { label: '选项 A', value: 'a' },
      { label: '选项 B', value: 'b' }
    ]
  },
  {
    type: 'RadioGroup',
    label: '单选组',
    group: '选择',
    description: '单项选择',
    icon: '◉',
    defaultProps: {},
    defaultOptions: [
      { label: '是', value: 'yes' },
      { label: '否', value: 'no' }
    ]
  },
  {
    type: 'CheckboxGroup',
    label: '多选组',
    group: '选择',
    description: '多项选择',
    icon: '☑',
    defaultProps: {},
    defaultOptions: [
      { label: '选项 1', value: '1' },
      { label: '选项 2', value: '2' }
    ]
  },
  {
    type: 'DatePicker',
    label: '日期',
    group: '日期时间',
    description: '日期选择',
    icon: '📅',
    defaultProps: { format: 'YYYY-MM-DD', valueFormat: 'YYYY-MM-DD' }
  },
  {
    type: 'TimePicker',
    label: '时间',
    group: '日期时间',
    description: '时间选择',
    icon: '⏰',
    defaultProps: { format: 'HH:mm' }
  },
  {
    type: 'Switch',
    label: '开关',
    group: '基础输入',
    description: '是/否开关',
    icon: '🔘'
  },
  {
    type: 'DisplayText',
    label: '只读展示',
    group: '特殊',
    description: '展示计算结果或常量',
    icon: '👁️'
  },
  {
    type: 'Upload',
    label: '文件上传',
    group: '特殊',
    description: '支持图片、文件上传及预览',
    icon: '📎',
    defaultProps: {
      accept: 'image/*',
      maxCount: 5,
      listType: 'picture-card',
      maxSize: 10
    }
  }
]

export const COMPONENT_GROUP_ORDER: ComponentLibraryItem['group'][] = [
  '基础输入',
  '选择',
  '日期时间',
  '特殊'
]