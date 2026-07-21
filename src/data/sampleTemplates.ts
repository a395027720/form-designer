/**
 * 内置演示模板：血常规、肝功能
 * 首次访问时注入到 localStorage
 */
import type { FormTemplate } from '@/types/template'

export function sampleTemplates(): FormTemplate[] {
  const now = new Date().toISOString()
  return [
    {
      version: '1.0.0',
      id: 'tmpl_blood_routine_demo',
      name: '血常规检查报告',
      category: '血液检查',
      description: '演示阈值分级（白细胞）+ 计算规则（平均红细胞体积 = 红细胞压积 / 红细胞计数）',
      layout: { type: 'form' },
      components: [
        {
          id: 'comp_name',
          type: 'Input',
          field: 'patientName',
          label: '患者姓名',
          required: true,
          props: { placeholder: '请输入姓名', maxLength: 50 },
          rules: [
            {
              id: 'rule_name_required',
              type: 'validation',
              name: '姓名必填',
              enabled: true,
              trigger: 'onBlur',
              params: { validators: [{ type: 'required', message: '姓名不能为空' }] }
            }
          ]
        },
        {
          id: 'comp_gender',
          type: 'RadioGroup',
          field: 'gender',
          label: '性别',
          required: true,
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' }
          ],
          rules: []
        },
        {
          id: 'comp_wbc',
          type: 'InputNumber',
          field: 'wbc',
          label: '白细胞计数',
          unit: '10^9/L',
          required: true,
          props: { min: 0, max: 100, precision: 2, placeholder: '请输入' },
          rules: [
            {
              id: 'rule_wbc_threshold',
              type: 'threshold',
              name: '白细胞分级',
              enabled: true,
              trigger: 'onChange',
              params: {
                ranges: [
                  { min: null, max: 4, label: '偏低', level: 'low', color: '#52c41a' },
                  { min: 4, max: 10, label: '正常', level: 'normal', color: '#1890ff' },
                  { min: 10, max: null, label: '偏高', level: 'high', color: '#f5222d' }
                ],
                actions: [
                  { type: 'setText', target: '$.self.suffix', value: '$label' }
                ]
              }
            }
          ]
        },
        {
          id: 'comp_rbc',
          type: 'InputNumber',
          field: 'rbc',
          label: '红细胞计数',
          unit: '10^12/L',
          props: { min: 0, max: 20, precision: 2, placeholder: '请输入' },
          rules: []
        },
        {
          id: 'comp_hct',
          type: 'InputNumber',
          field: 'hct',
          label: '红细胞压积',
          unit: '%',
          props: { min: 0, max: 100, precision: 2, placeholder: '请输入' },
          rules: []
        },
        {
          id: 'comp_mcv',
          type: 'DisplayText',
          field: 'mcv',
          label: '平均红细胞体积 (MCV)',
          unit: 'fL',
          props: { prefix: '', suffix: '' },
          rules: [
            {
              id: 'rule_mcv_calc',
              type: 'calculation',
              name: 'MCV = HCT / RBC',
              enabled: true,
              trigger: 'onChange',
              params: {
                template: 'custom',
                expression: '$.components.comp_hct.value / $.components.comp_rbc.value',
                precision: 2
              }
            }
          ]
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      version: '1.0.0',
      id: 'tmpl_liver_demo',
      name: '肝功能检查报告',
      category: '肝功能',
      description: '演示条件显隐（女性显示妊娠相关胆红素）+ 校验规则（数值范围）',
      layout: { type: 'form' },
      components: [
        {
          id: 'liver_name',
          type: 'Input',
          field: 'patientName',
          label: '患者姓名',
          required: true,
          props: { placeholder: '请输入', maxLength: 50 },
          rules: []
        },
        {
          id: 'liver_gender',
          type: 'RadioGroup',
          field: 'gender',
          label: '性别',
          required: true,
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' }
          ],
          rules: []
        },
        {
          id: 'liver_age',
          type: 'InputNumber',
          field: 'age',
          label: '年龄',
          unit: '岁',
          props: { min: 0, max: 150, precision: 0, placeholder: '请输入' },
          rules: []
        },
        {
          id: 'liver_tbil',
          type: 'InputNumber',
          field: 'tbil',
          label: '总胆红素',
          unit: 'μmol/L',
          required: true,
          props: { min: 0, max: 500, precision: 2, placeholder: '请输入' },
          rules: [
            {
              id: 'liver_tbil_valid',
              type: 'validation',
              name: '总胆红素校验',
              enabled: true,
              trigger: 'onBlur',
              params: {
                validators: [
                  { type: 'required', message: '总胆红素不能为空' },
                  { type: 'min', value: 0, message: '不能小于 0' },
                  { type: 'max', value: 500, message: '不能大于 500' }
                ]
              }
            },
            {
              id: 'liver_tbil_threshold',
              type: 'threshold',
              name: '总胆红素分级',
              enabled: true,
              trigger: 'onChange',
              params: {
                ranges: [
                  { min: null, max: 17.1, label: '正常', level: 'normal', color: '#1890ff' },
                  { min: 17.1, max: 34.2, label: '隐性黄疸', level: 'low', color: '#faad14' },
                  { min: 34.2, max: null, label: '明显黄疸', level: 'high', color: '#f5222d' }
                ],
                actions: [
                  { type: 'setText', target: '$.self.suffix', value: '$label' }
                ]
              }
            }
          ]
        },
        {
          id: 'liver_dbil',
          type: 'InputNumber',
          field: 'dbil',
          label: '直接胆红素',
          unit: 'μmol/L',
          props: { min: 0, max: 200, precision: 2, placeholder: '请输入' },
          rules: []
        },
        {
          id: 'liver_preg',
          type: 'InputNumber',
          field: 'pregnancyBil',
          label: '妊娠相关胆红素',
          unit: 'μmol/L',
          props: { min: 0, max: 100, precision: 2, placeholder: '仅女性患者填写' },
          rules: []
        },
        {
          id: 'liver_gender_rule',
          type: 'DisplayText',
          field: 'display_hidden',
          label: '（条件显隐演示）',
          rules: [
            {
              id: 'rule_show_preg',
              type: 'conditional',
              name: '女性显示妊娠项',
              enabled: true,
              trigger: 'onChange',
              params: {
                when: {
                  operator: '==',
                  left: '$.components.liver_gender.value',
                  right: { type: 'constant', value: 'female' }
                },
                then: { type: 'show', target: '$.components.liver_preg' },
                else: { type: 'hidden', target: '$.components.liver_preg' }
              }
            }
          ]
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ]
}