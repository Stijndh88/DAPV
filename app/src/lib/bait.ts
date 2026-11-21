/**
 * Bait and feed labels for waters, shown like allergen labels: one icon per kind,
 * "mag" (allowed) or "mag niet" (forbidden), for feeding and for on the hook.
 * Editors tick them in Viswaters > Voeders. The icon artwork is in components/site/BaitIcon.tsx.
 */
export const baitKinds = [
  { value: 'voeder', label: 'Voeder', hint: 'lokvoer, amorce' },
  { value: 'leem', label: 'Leem' },
  { value: 'witte-maden', label: 'Witte maden' },
  { value: 'casters', label: 'Casters' },
  { value: 'rode-maden', label: 'Rode maden' },
  { value: 'muggenlarven', label: 'Muggenlarven', hint: 'vers de vase, vdv' },
  { value: 'pieren', label: 'Pieren' },
  { value: 'insecten', label: 'Insecten' },
  { value: 'granen', label: 'Granen en zaden', hint: 'o.a. kemp, tarwe' },
  { value: 'mais', label: 'Maïs' },
  { value: 'korrels', label: 'Korrels', hint: 'pellets' },
  { value: 'zinkers', label: 'Zinkers', hint: 'zinkende korrels' },
  { value: 'drijvend', label: 'Drijvend aas', hint: 'brood, drijvende korrels' },
  { value: 'deeg', label: 'Deeg en spijswaren' },
  { value: 'pasta', label: 'Pasta' },
  { value: 'den-bol', label: '“Den bol”' },
  { value: 'aasvisjes', label: 'Aasvisjes' },
] as const

export type BaitKind = (typeof baitKinds)[number]['value']

export const baitLabel = (v: string) => baitKinds.find((b) => b.value === v)?.label ?? v

export const baitOptions = baitKinds.map((b) => ({ label: 'hint' in b ? `${b.label} (${b.hint})` : b.label, value: b.value }))

/** Keep the catalogue order, so labels line up the same way on every page. */
export const sortBaits = (list?: readonly string[] | null) =>
  [...new Set(list ?? [])].sort((a, b) => baitKinds.findIndex((k) => k.value === a) - baitKinds.findIndex((k) => k.value === b))
