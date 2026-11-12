export type Band = {
  /** Zeitpunkt (ms) der letzten Antwort; null, solange es noch keine gab. */
  lastAt: number | null
  /** Cache-Laufzeit in Minuten: 5 oder 60 (1 Stunde). */
  ttlMin: 5 | 60
  /** Anteil der Input-Tokens der letzten Antwort, die aus dem Cache kamen (0 bis 1). */
  hit: number | null
  /** Tokens im Kontext, Fenstergröße und Auto-Compact-Schwelle (in Tokens). */
  tokens: number | null
  window: number | null
  threshold: number | null
  /** Claude arbeitet gerade. */
  busy: boolean
  /** Leiste zugeklappt. */
  collapsed: boolean
  /** /compact ist eingereiht und startet, sobald Claude fertig ist. */
  queued: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'cache-band': { band: Band }
  }
}
