import { expect } from 'vitest'

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
