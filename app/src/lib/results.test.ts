import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseResultsPaste, rankEntries } from './results'

test('parses Excel tab paste with Belgian decimals', () => {
  const r = parseResultsPaste('Naam\tGewicht\tAantal\nJan Peeters\t4,350\t12\nMarc (v)\t3120\t9')
  assert.equal(r.length, 2)
  assert.equal(r[0].name, 'Jan Peeters')
  assert.equal(r[0].weight, 4.35)
  assert.equal(r[0].fishCount, 12)
  assert.equal(r[1].name, 'Marc')
  assert.equal(r[1].category, 'v')
  assert.equal(r[1].weight, 3.12)
})

test('parses semicolons, leading places and single spaces', () => {
  const r = parseResultsPaste('1;Luc Verhoeven;2,5;7\n2  Rita Jacobs  1.200 kg  4\nWim Aerts 0,8 3')
  assert.equal(r[0].name, 'Luc Verhoeven')
  assert.equal(r[0].weight, 2.5)
  assert.equal(r[1].name, 'Rita Jacobs')
  assert.equal(r[1].weight, 1.2)
  assert.equal(r[2].name, 'Wim Aerts')
  assert.equal(r[2].fishCount, 3)
})

test('ranks by weight with shared places and points', () => {
  const r = rankEntries<{ weight: number; disqualified?: boolean; place?: number | null; points?: number | null }>([{ weight: 1 }, { weight: 3 }, { weight: 3 }, { weight: 0 }, { weight: 2, disqualified: true }])
  assert.deepEqual(r.map((e) => [e.weight, e.place, e.points]), [[3, 1, 4], [3, 1, 4], [1, 3, 2], [0, 4, 1], [2, null, 0]])
})
