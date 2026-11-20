/** Minimal Lexical JSON builder for seed/import scripts. */
type Node = Record<string, unknown>

const text = (t: string, format = 0): Node => ({ type: 'text', text: t, format, detail: 0, mode: 'normal', style: '', version: 1 })

export const p = (...parts: (string | Node)[]): Node => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  children: parts.map((x) => (typeof x === 'string' ? text(x) : x)),
})
export const b = (t: string) => text(t, 1)
export const h = (t: string, tag: 'h2' | 'h3' = 'h2'): Node => ({
  type: 'heading',
  tag,
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  children: [text(t)],
})
export const ul = (...items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  children: items.map((t, i) => ({ type: 'listitem', value: i + 1, version: 1, direction: 'ltr', format: '', indent: 0, children: [text(t)] })),
})

export const doc = (...children: Node[]) => ({
  root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children },
})
