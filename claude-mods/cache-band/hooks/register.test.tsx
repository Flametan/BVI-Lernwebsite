import { expect, test } from 'claude-code/testing'

import { barColor, chunks, remaining, weather } from './register'

test('Wetter nach der Auto-Compact-Schwelle', () => {
  expect(weather(40_000, 100_000)).toBe('☀️')
  expect(weather(50_000, 100_000)).toBe('☀️')
  expect(weather(70_000, 100_000)).toBe('🌧️')
  expect(weather(80_000, 100_000)).toBe('🌧️')
  expect(weather(81_000, 100_000)).toBe('⛈️')
})

test('Balkenfarbe: grün, im letzten Viertel gelb, in den letzten 10 % rot', () => {
  expect(barColor(1)).toBe('green')
  expect(barColor(0.26)).toBe('green')
  expect(barColor(0.25)).toBe('yellow')
  expect(barColor(0.11)).toBe('yellow')
  expect(barColor(0.1)).toBe('red')
  expect(barColor(0)).toBe('red')
})

const BAND = { lastAt: 0, ttlMin: 5 as const, hit: null, tokens: null, window: null, threshold: null, busy: false, collapsed: false, queued: false }

test('Restzeit zählt ab der letzten Antwort, 1 Stunde bei 1h-Cache', () => {
  expect(remaining(BAND, 60_000).ms).toBe(4 * 60_000)
  expect(remaining(BAND, 5 * 60_000).ms).toBe(0)
  expect(remaining(BAND, 9 * 60_000).ms).toBe(0)
  expect(remaining({ ...BAND, ttlMin: 60 }, 30 * 60_000).fraction).toBe(0.5)
  expect(remaining({ ...BAND, busy: true }, 99 * 60_000).fraction).toBe(1)
})

test('Lange Zusammenfassungen werden an Absätzen geteilt, nichts geht verloren', () => {
  const para = 'a'.repeat(700)
  const text = [para, para, para, para].join('\n\n')
  const parts = chunks(text, 1800)
  expect(parts.length).toBe(2)
  expect(parts.every(p => p.length <= 1800)).toBe(true)
  expect(parts.join('\n\n')).toBe(text)
  const huge = 'b'.repeat(4000)
  expect(chunks(huge, 1800).join('')).toBe(huge)
})
