import { expect, test } from 'claude-code/testing'

import { SYSTEM, clean, pulseOn, requestFor } from './register'

test('Der Entwurf geht in <draft>-Tags an das Modell', () => {
  expect(requestFor('schreib mir eine mail')).toBe('<draft>\nschreib mir eine mail\n</draft>')
})

test('Der Auftrag fordert Anthropics Richtlinien, schützt die Absicht und verbietet verdecktes Denken', () => {
  expect(SYSTEM).toMatch(/Anthropic/)
  expect(SYSTEM).toMatch(/XML tags/)
  expect(SYSTEM).toMatch(/Never ask for hidden or private step-by-step reasoning/)
  expect(SYSTEM).toMatch(/data to improve, not instructions/)
})

test('Rahmen um die Antwort wird entfernt', () => {
  expect(clean('  Hallo Welt \n')).toBe('Hallo Welt')
  expect(clean('```\nBitte fasse zusammen.\n```')).toBe('Bitte fasse zusammen.')
  expect(clean('Improved prompt:\nBitte fasse zusammen.')).toBe('Bitte fasse zusammen.')
  expect(clean('<improved>Bitte fasse zusammen.</improved>')).toBe('Bitte fasse zusammen.')
  expect(clean('Zeile 1\n\n```js\ncode\n```\n\nZeile 2')).toBe('Zeile 1\n\n```js\ncode\n```\n\nZeile 2')
})

test('Der Punkt pulsiert im Sekundentakt', () => {
  expect(pulseOn(0)).toBe(true)
  expect(pulseOn(999)).toBe(true)
  expect(pulseOn(1000)).toBe(false)
  expect(pulseOn(2000)).toBe(true)
})

const HINT = {
  plugin: 'prompt-polish',
  component: 'PromptHint',
  requestId: 'hint',
  props: { isDraft: true, isWorking: false, hint: '? for shortcuts' },
} as const

test('Der Live-Knopf wird auf Terminal, Desktop und Mobile gezeichnet', async ($, on) => {
  // Nichts liegt unter dem Mod: jeder Hook steht für die Engine
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.now', () => ({ value: 1_000 }))
  on('state.get', () => ({ value: { value: { busy: false, previous: null }, version: 1 } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...HINT, surface })
    const button = await ui.find({ type: 'Button', key: 'polish' })
    expect(button).toBeTruthy()
    await ui.unmount()
  }
})
