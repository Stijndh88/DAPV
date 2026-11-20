'use client'
import { useRowLabel } from '@payloadcms/ui'

type Row = { place?: number; weight?: number; fishCount?: number; angler?: unknown }

export const EntryRowLabel = () => {
  const { data, rowNumber } = useRowLabel<Row>()
  const place = data?.place ?? (rowNumber ?? 0) + 1
  const w = typeof data?.weight === 'number' ? `${data.weight.toLocaleString('nl-BE', { minimumFractionDigits: 3 })} kg` : '—'
  const n = typeof data?.fishCount === 'number' ? ` · ${data.fishCount} vissen` : ''
  return <span>{`${place}. ${w}${n}`}</span>
}
