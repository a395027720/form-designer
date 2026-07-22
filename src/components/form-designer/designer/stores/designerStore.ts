/**
 * 设计器临时 ID 生成器（无需 Pinia 的纯模块）
 */
let tempIdCounter = 0

export function generateTempId(): string {
  tempIdCounter += 1
  return `temp-${Date.now()}-${tempIdCounter}`
}

/**
 * 给 inline 组件补临时 id（仅作 v-for key，不暴露给 consumer）
 * 已有 id 的不动；in place 修改
 */
export function ensureTempIds<T extends { id?: string }>(components: T[]): T[] {
  components.forEach(c => {
    if (!c.id) {
      c.id = generateTempId()
    }
  })
  return components
}
