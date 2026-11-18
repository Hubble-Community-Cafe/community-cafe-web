import { expect } from 'vitest'
import { screen } from '@testing-library/react'

/** A promise the test resolves itself, to look at the form while it is still sending. */
export function pending(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void
  const promise = new Promise<void>((r) => { resolve = r })
  return { promise, resolve }
}

/** The honeypot must stay invisible and unreachable for people, so only bots fill it in. */
export function expectHiddenHoneypot(container: HTMLElement): void {
  const honeypot = container.querySelector<HTMLInputElement>('input[name="website"]')
  expect(honeypot, 'honeypot field').not.toBeNull()
  expect(honeypot).toHaveAttribute('aria-hidden', 'true')
  expect(honeypot).toHaveAttribute('tabindex', '-1')
  expect(honeypot).toHaveValue('')
}

export function file(name: string, type: string, bytes = 3): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

/** `{error && <p …>` or `{loadError && (\n <div …>`: an error shown only when something failed. */
const ERROR_ELEMENT = /\{\s*(\w*(?:error|Error))\s*&&\s*\(?\s*<(\w+)\b([^>]*)>/g

/**
 * Error messages that appear without `role="alert"`, as "file:line". Screen readers only announce
 * text that appears later when it is marked as an alert, so without it a failed load or save
 * passes in silence. Pass the app's component sources, read with `import.meta.glob(…, '?raw')`.
 */
export function unannouncedErrors(sources: Record<string, string>): string[] {
  return Object.entries(sources).flatMap(([file, source]) =>
    [...source.matchAll(ERROR_ELEMENT)]
      .filter((match) => !/\brole="alert"/.test(match[3]))
      .map((match) => `${file}:${source.slice(0, match.index).split('\n').length}`))
}

/** The loading skeleton is on screen and screen readers hear it: a status saying "Loading…". */
export function expectLoadingSkeleton(testId: string): void {
  const skeleton = screen.getByTestId(testId)
  expect(skeleton).toHaveAttribute('role', 'status')
  expect(skeleton).toHaveTextContent('Loading…')
}
