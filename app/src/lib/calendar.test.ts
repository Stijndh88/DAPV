import { test } from 'node:test'
import assert from 'node:assert/strict'
import { brusselsToUtc, fishingTimes, toIcs } from './calendar'
import type { Competition } from '@/payload-types'

test('Brussels times become UTC in summer and winter', () => {
  assert.equal(brusselsToUtc('2026-04-04', '07:45'), '20260404T054500Z')
  assert.equal(brusselsToUtc('2026-11-07', '07:45'), '20261107T064500Z')
})

test('a match in two parts shows both blocks', () => {
  assert.equal(fishingTimes({ startTime: '09:00', breakStart: '12:00', breakEnd: '13:30', endTime: '17:00' }), '09:00 tot 12:00 en 13:30 tot 17:00')
  assert.equal(fishingTimes({ startTime: '10:00', endTime: '16:00' }), '10:00 tot 16:00')
})

test('ics: timed and all-day events, escaped text, folded lines', () => {
  const base = { id: 1, season: 2026, updatedAt: '', createdAt: '', countsForStandings: true, type: 'club' } as const
  const ics = toIcs(
    [
      { ...base, slug: 'a', title: 'GP Fam. Arijs, deel 1', date: '2026-04-04T12:00:00Z', drawTime: '07:45', startTime: '09:00', endTime: '17:00' } as Competition,
      { ...base, id: 2, slug: 'b', title: 'Duitsland - België', date: '2026-09-05T12:00:00Z', type: 'vriendschappelijk', countsForStandings: false } as Competition,
    ],
    { name: 'Test', siteUrl: 'https://plasvissers.be' },
  )
  assert.match(ics, /DTSTART:20260404T054500Z\r\nDTEND:20260404T150000Z/)
  assert.match(ics, /SUMMARY:GP Fam\. Arijs\\, deel 1/)
  assert.match(ics, /DTSTART;VALUE=DATE:20260905/)
  assert.ok(ics.split('\r\n').every((l) => Buffer.byteLength(l) <= 75))
})
