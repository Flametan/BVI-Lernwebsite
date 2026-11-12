export type Polish = {
  /** Die Verbesserung läuft gerade. */
  busy: boolean
  /** Der Entwurf vor der letzten Verbesserung (für „Original“), sonst null. */
  previous: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'prompt-polish': { polish: Polish }
  }
}
