import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Band } from '../types'

// ── Einstellungen ───────────────────────────────────────────────────────────
const BAR_CELLS = 20
const FALLBACK_THRESHOLD = 0.83 // Anteil des Fensters, wenn sich die Auto-Compact-Schwelle nicht auslesen lässt
const CHUNK = 1800 // Zeichen je Log-Zeile (das Terminal zeichnet die ersten 2000)
const STORE_TTL = 'ttlMin'

const INITIAL: Band = {
  lastAt: null,
  ttlMin: 5,
  hit: null,
  tokens: null,
  window: null,
  threshold: null,
  busy: false,
  collapsed: false,
  queued: false,
}
const band = atom({ plugin: 'cache-band', key: 'band' } as const, INITIAL)

// ── Rechnen ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => Math.round(n).toLocaleString('de-DE')

/** Wetter für den Kontext: Verhältnis der Füllung zur Auto-Compact-Schwelle. */
export function weather(tokens: number | null, threshold: number | null): string {
  if (tokens === null || !threshold) return '☀️'
  const ratio = tokens / threshold
  if (ratio <= 0.5) return '☀️'
  if (ratio <= 0.8) return '🌧️'
  return '⛈️'
}

/** Restanteil des Caches (0 bis 1) und Restzeit in Millisekunden. */
export function remaining(s: Band, now: number): { fraction: number; ms: number } {
  const total = s.ttlMin * 60_000
  if (s.busy || s.lastAt === null) return { fraction: 1, ms: total } // Claude arbeitet: jede Anfrage verlängert den Cache
  const ms = Math.max(0, total - (now - s.lastAt))
  return { fraction: ms / total, ms }
}

export function barColor(fraction: number): string {
  if (fraction <= 0.1) return 'red'
  if (fraction <= 0.25) return 'yellow'
  return 'green'
}

/** Teilt einen langen Text an Absätzen (dann an Zeilen, dann hart) in Stücke bis `max` Zeichen. */
export function chunks(text: string, max = CHUNK): string[] {
  const out: string[] = []
  let cur = ''
  const push = (piece: string) => {
    if (cur && cur.length + 2 + piece.length > max) {
      out.push(cur)
      cur = ''
    }
    cur = cur ? cur + '\n\n' + piece : piece
  }
  for (const para of text.trim().split(/\n{2,}/)) {
    if (para.length <= max) {
      push(para)
      continue
    }
    for (const line of para.split('\n')) {
      if (line.length <= max) {
        push(line)
        continue
      }
      for (let i = 0; i < line.length; i += max) push(line.slice(i, i + max))
    }
  }
  if (cur) out.push(cur)
  return out
}

const set = (patch: Partial<Band>) => (s: Band): Band => ({ ...s, ...patch })

// Kontext, Cache-Treffer und Auto-Compact-Schwelle der Session auslesen
async function refreshUsage($: EngineInterface) {
  try {
    const u = await $.session.usage({ breakdown: 'summary' })
    const b = u.context.breakdown
    const window = b?.rawMaxTokens ?? u.context.window
    const threshold = b?.isAutoCompactEnabled && b.autoCompactThreshold ? b.autoCompactThreshold : Math.round(window * FALLBACK_THRESHOLD)
    const api = b?.apiUsage
    const denom = api ? api.input_tokens + api.cache_read_input_tokens + api.cache_creation_input_tokens : 0
    await update($, band, s => ({
      ...s,
      tokens: u.context.tokens ?? null,
      window,
      threshold,
      hit: api && denom > 0 ? api.cache_read_input_tokens / denom : s.hit,
    }))
  } catch {
    // die Leiste bleibt auf dem letzten Stand
  }
}

// Compact auslösen: direkt, sonst als /compact eingereiht (Desktop-App oder Claude arbeitet gerade)
async function compactNow($: EngineInterface, surface: string) {
  const state = await read($, band)
  if (state.queued) return
  const queue = async () => {
    await update($, band, set({ queued: true }))
    $.ui.toast('/compact eingereiht, startet nach Claudes Antwort')
    await $.prompt.submit({ text: '/compact', asUser: true })
  }
  if (surface === 'desktop' || state.busy) return queue()
  try {
    const r = await $.session.compact()
    if (r.skip !== undefined) $.ui.toast(`Compact übersprungen: ${r.skip}`)
  } catch {
    await queue()
  }
}

export const register: Register = (on, _options) => {
  on('session.start', async ($, e, next) => {
    const saved = await $.store.get(STORE_TTL)
    const ttlMin: 5 | 60 = saved === 60 ? 60 : 5
    await update($, band, s => ({ ...INITIAL, ttlMin, collapsed: s.collapsed }))
    // jede Minute neu zeichnen
    $.clock.every(60_000, () => $.ui.invalidate('ui.render'))
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (!e.agentId) await update($, band, set({ busy: true }))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) return next(e)
    const now = await $.clock.now()
    const before = await read($, band)
    let ttlMin: 5 | 60 = before.ttlMin

    // Die Cache-Laufzeit der Session lernen: War die Pause länger als 5 Minuten, sagt die Cache-Nutzung, ob der Cache noch lebte
    // (Laufzeit 1 Stunde) oder neu geschrieben werden musste (Laufzeit 5 Minuten).
    const gapMs = before.lastAt === null ? 0 : now - e.durationMs - before.lastAt
    const prev = before.tokens
    if (e.usage && prev && gapMs > 5.5 * 60_000 && gapMs < 55 * 60_000) {
      const { cache_read_input_tokens: read_, cache_creation_input_tokens: made } = e.usage
      if (made >= prev * 0.6) ttlMin = 5
      else if (read_ >= prev * 0.5 && made <= prev * 0.2) ttlMin = 60
      if (ttlMin !== before.ttlMin) await $.store.set(STORE_TTL, ttlMin)
    }

    await update($, band, set({ busy: false, lastAt: now, ttlMin }))
    await refreshUsage($)
    return next(e)
  })

  // Nach /compact, einem Klick auf „Compact“ oder Auto-Compact: Tokens vorher und nachher, darunter die Zusammenfassung
  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId || e.trigger === 'precompute' || r.skip !== undefined || !r.messages) return r

    const { tokensBefore, tokensAfter } = r
    const head =
      tokensBefore !== undefined && tokensAfter !== undefined
        ? `Compact: ${fmt(tokensBefore)} → ${fmt(tokensAfter)} Tokens${tokensBefore > 0 ? ` (−${Math.round((1 - tokensAfter / tokensBefore) * 100)} %)` : ''}`
        : 'Compact abgeschlossen'
    $.ui.log(head) // nur Anzeige, das Modell liest diese Zeilen nicht mit
    const summary = r.messages[0]?.text ?? ''
    for (const part of chunks(summary)) $.ui.log(part)

    await update($, band, s => ({
      ...s,
      queued: false,
      tokens: tokensAfter ?? s.tokens,
      hit: null,
    }))
    return r
  }).catch(($, e, next) => next(e)) // schlägt der Mod fehl, läuft das Compact trotzdem

  // ── Die Leiste ─────────────────────────────────────────────────────────────
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const s = await read($, band)
    const now = await $.clock.now()
    const { Box, Button, Text } = $.ui.resolve(e)
    const surface = e.surface

    const { fraction, ms } = remaining(s, now)
    const minutes = Math.ceil(ms / 60_000)
    const expired = s.lastAt !== null && !s.busy && ms <= 0
    const filled = expired ? 0 : Math.max(0, Math.min(BAR_CELLS, Math.ceil(fraction * BAR_CELLS)))
    const cacheText = s.lastAt === null ? '–' : expired ? 'abgelaufen' : `${minutes} min`
    const percent = s.tokens !== null && s.window ? Math.round((s.tokens / s.window) * 100) : null
    const thresholdPercent = s.threshold && s.window ? Math.round((s.threshold / s.window) * 100) : null
    const sky = weather(s.tokens, s.threshold)
    const isStorm = sky === '⛈️'

    const toggle = (
      <Button
        key="toggle"
        label={s.collapsed ? '▸' : '▾'}
        plain
        onPress={() => update($, band, st => ({ ...st, collapsed: !st.collapsed }))}
      />
    )

    if (s.collapsed) {
      return (
        <Box>
          <Text>{sky} </Text>
          <Text dimColor>Cache </Text>
          <Text color={expired ? 'red' : barColor(fraction)}>{cacheText}</Text>
          <Text dimColor> · Kontext </Text>
          <Text>{percent === null ? '–' : `${percent} %`} </Text>
          {toggle}
        </Box>
      )
    }

    return (
      <Box>
        <Text dimColor>Cache </Text>
        <Text color={expired ? 'red' : barColor(fraction)}>{cacheText} </Text>
        <Text color={barColor(fraction)}>{'■'.repeat(filled)}</Text>
        <Text dimColor>{'□'.repeat(BAR_CELLS - filled)}</Text>
        <Text dimColor> · Treffer </Text>
        <Text>{s.hit === null ? '–' : `${Math.round(s.hit * 100)} %`}</Text>
        <Text dimColor> · </Text>
        <Text>{sky} </Text>
        <Text>{percent === null ? '–' : `${percent} %`}</Text>
        <Text dimColor>{thresholdPercent === null ? '' : ` (Compact ab ${thresholdPercent} %)`} </Text>
        <Button
          key="compact"
          label={s.queued ? 'Compact …' : 'Compact'}
          variant={isStorm ? 'primary' : 'secondary'}
          onPress={() => compactNow($, surface)}
        />
        <Text> </Text>
        {toggle}
      </Box>
    )
  })
}
