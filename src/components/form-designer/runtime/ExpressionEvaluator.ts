/**
 * 表达式求值器
 * - 支持 + - * / ( ) 和数字常量
 * - 支持 $.components.{id}.value 路径引用
 * - 支持 Math.max / Math.min / Math.abs 等常用函数
 *
 * 设计目标：
 *   不引入第三方数学库（需求简单），手写一个小型递归下降解析器即可。
 */

export type ValueResolver = (componentId: string) => any

export class ExpressionEvaluator {
  constructor(private resolveValue: ValueResolver) {}

  evaluate(expression: string): any {
    if (!expression || !expression.trim()) return undefined
    try {
      const ast = parse(expression)
      return evalAst(ast, this.resolveValue)
    } catch (e: any) {
      console.warn('[ExpressionEvaluator] 求值失败:', expression, e.message)
      return undefined
    }
  }
}

// ---------- AST ----------
type Node =
  | { type: 'num'; value: number }
  | { type: 'ref'; id: string }
  | { type: 'call'; name: string; args: Node[] }
  | { type: 'binop'; op: string; left: Node; right: Node }
  | { type: 'unary'; op: string; arg: Node }

// ---------- 词法 ----------
type Token = { type: string; value: string }

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) { i++; continue }
    if ('+-*/(),'.includes(ch)) { tokens.push({ type: ch, value: ch }); i++; continue }
    if (/[0-9.]/.test(ch)) {
      let j = i
      while (j < input.length && /[0-9.]/.test(input[j])) j++
      tokens.push({ type: 'num', value: input.slice(i, j) })
      i = j; continue
    }
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i
      while (j < input.length && /[a-zA-Z0-9_$.]/.test(input[j])) j++
      tokens.push({ type: 'ident', value: input.slice(i, j) })
      i = j; continue
    }
    throw new Error(`无法识别的字符: ${ch}`)
  }
  return tokens
}

// ---------- 解析：递归下降 ----------
class Parser {
  pos = 0
  constructor(private tokens: Token[]) {}

  peek(): Token | undefined { return this.tokens[this.pos] }
  consume(): Token { return this.tokens[this.pos++] }

  parse(): Node { return this.expr() }

  expr(): Node {
    let left = this.term()
    while (this.peek()?.type === '+' || this.peek()?.type === '-') {
      const op = this.consume().type
      const right = this.term()
      left = { type: 'binop', op, left, right }
    }
    return left
  }

  term(): Node {
    let left = this.unary()
    while (this.peek()?.type === '*' || this.peek()?.type === '/') {
      const op = this.consume().type
      const right = this.unary()
      left = { type: 'binop', op, left, right }
    }
    return left
  }

  unary(): Node {
    if (this.peek()?.type === '-') {
      this.consume()
      return { type: 'unary', op: '-', arg: this.unary() }
    }
    return this.primary()
  }

  primary(): Node {
    const t = this.consume()
    if (!t) throw new Error('表达式意外结束')
    if (t.type === 'num') return { type: 'num', value: Number(t.value) }
    if (t.type === '(') {
      const node = this.expr()
      if (this.peek()?.type !== ')') throw new Error('缺少 )')
      this.consume()
      return node
    }
    if (t.type === 'ident') {
      // $.components.xxx.value 整个被识别为 ident
      if (t.value.startsWith('$.components.') && t.value.endsWith('.value')) {
        const id = t.value.slice('$.components.'.length, -'.value'.length)
        return { type: 'ref', id }
      }
      // Math.max(...)
      if (t.value.startsWith('Math.') && this.peek()?.type === '(') {
        this.consume() // (
        const args: Node[] = []
        if (this.peek()?.type !== ')') {
          args.push(this.expr())
          while (this.peek()?.type === ',') { this.consume(); args.push(this.expr()) }
        }
        if (this.peek()?.type !== ')') throw new Error('函数调用缺少 )')
        this.consume()
        return { type: 'call', name: t.value, args }
      }
      throw new Error(`未识别的标识符: ${t.value}`)
    }
    throw new Error(`未识别的 token: ${t.value}`)
  }
}

function parse(input: string): Node {
  const tokens = tokenize(input)
  const parser = new Parser(tokens)
  const node = parser.parse()
  if (parser.pos !== tokens.length) throw new Error('表达式解析未完成')
  return node
}

// ---------- 求值 ----------
function evalAst(node: Node, resolve: ValueResolver): any {
  switch (node.type) {
    case 'num': return node.value
    case 'ref': return resolve(node.id)
    case 'unary': return -evalAst(node.arg, resolve)
    case 'binop': {
      const l = evalAst(node.left, resolve)
      const r = evalAst(node.right, resolve)
      if (l === undefined || r === undefined) return undefined
      switch (node.op) {
        case '+': return Number(l) + Number(r)
        case '-': return Number(l) - Number(r)
        case '*': return Number(l) * Number(r)
        case '/': return Number(l) / Number(r)
      }
      return undefined
    }
    case 'call': {
      const args = node.args.map(a => evalAst(a, resolve))
      if (args.some(a => a === undefined)) return undefined
      // 仅暴露 Math.max/min/abs/round/floor/ceil
      const fnMap: Record<string, (...a: any[]) => any> = {
        'Math.max': Math.max,
        'Math.min': Math.min,
        'Math.abs': Math.abs,
        'Math.round': Math.round,
        'Math.floor': Math.floor,
        'Math.ceil': Math.ceil
      }
      const fn = fnMap[node.name]
      if (!fn) throw new Error(`不支持的函数: ${node.name}`)
      return fn(...args)
    }
  }
}
