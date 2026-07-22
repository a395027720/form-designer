/**
 * 副作用应用器：负责把规则的副作用真正落到字段状态上
 *
 * 这里采用"集中状态 + 受控组件"的方案：
 *   FormRenderer 维护一个 FieldState Map<id, FieldState>
 *   ActionApplier 接受 setter 回调，规则触发时直接更新 FieldState
 */

import type { RuleAction } from '../types'

export interface FieldState {
  visible: boolean
  style: Record<string, string>
  suffix: string
  classes: string[]
  required: boolean
  autoCalculated: boolean  // 标记是否被 calculation 规则写入
}

export function createDefaultState(): FieldState {
  return {
    visible: true,
    style: {},
    suffix: '',
    classes: [],
    required: false,
    autoCalculated: false
  }
}

export type SetFieldState = (
  componentId: string,
  patch: Partial<FieldState> | ((s: FieldState) => Partial<FieldState>)
) => void

export class ActionApplier {
  constructor(private setFieldState: SetFieldState) {}

  /** 归零可变副作用（style/classes/suffix），避免旧规则特效残留 */
  resetTransient(componentId: string) {
    this.setFieldState(componentId, { style: {}, classes: [], suffix: '' })
  }

  apply(action: RuleAction, selfId: string, context?: Record<string, any>) {
    let targetCompId = selfId
    let part: string | undefined

    if (action.target === '$.self') {
      targetCompId = selfId
    } else if (action.target === '$.self.suffix') {
      targetCompId = selfId
      part = 'suffix'
    } else {
      const m = action.target.match(/^\$\.components\.([^.]+)(\.suffix)?$/)
      if (!m) return
      targetCompId = m[1]
      part = m[2]?.slice(1)
    }

    const resolveValue = (v: any): any => {
      if (typeof v === 'string')
        return v.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => context?.[key] ?? '')
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const result: Record<string, any> = {}
        for (const key of Object.keys(v)) result[key] = resolveValue(v[key])
        return result
      }
      return v
    }

    switch (action.type) {
      case 'setValue':
        // setValue 不直接改状态值，由 FormRenderer 监听值变化后调引擎
        break
      case 'setStyle':
        this.setFieldState(targetCompId, { style: resolveValue(action.style) || {} })
        break
      case 'addClass':
        this.setFieldState(targetCompId, (s) => ({
          classes: Array.from(new Set([...(s.classes || []), resolveValue(action.value)]))
        }))
        break
      case 'removeClass':
        this.setFieldState(targetCompId, (s) => ({
          classes: (s.classes || []).filter(c => c !== resolveValue(action.value))
        }))
        break
      case 'setText':
        if (part === 'suffix') {
          this.setFieldState(targetCompId, { suffix: resolveValue(action.value) })
        }
        break
      case 'show':
        this.setFieldState(targetCompId, { visible: true })
        break
      case 'hidden':
        this.setFieldState(targetCompId, { visible: false })
        break
      case 'setRequired':
        this.setFieldState(targetCompId, { required: !!resolveValue(action.value) })
        break
    }
  }
}

/** 支持对象 patch 或函数 patch */
export function patchState(prev: FieldState, patch: Partial<FieldState> | ((s: FieldState) => Partial<FieldState>)): FieldState {
  const resolved = typeof patch === 'function' ? patch(prev) : patch
  return { ...prev, ...resolved }
}
