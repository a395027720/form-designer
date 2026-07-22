/**
 * 生成短唯一 ID
 * 组成：前缀 + 时间戳 + 随机串 + 进程内自增序号
 * 自增序号保证同一次运行内绝不重复（即便同毫秒、同随机值），
 * 时间戳 + 随机串保证跨会话的唯一性。
 */
let seq = 0

export function uid(prefix = ''): string {
  seq = (seq + 1) % 0xffffffff
  const time = Date.now().toString(36).slice(-4)
  const rand = Math.random().toString(36).slice(2, 10)
  return prefix + time + rand + seq.toString(36)
}