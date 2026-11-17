import { expect, it } from 'vitest'

const pages = import.meta.glob<string>('../pages/*Page.tsx', { query: '?raw', import: 'default', eager: true })

/**
 * Seven pages built their own title, in a different font and size from the rest. Every page
 * behind the sign-in uses PageHeader, so they all look alike and keep the help button.
 */
it('gives every admin page the shared PageHeader', () => {
  const ownTitles = Object.entries(pages)
    .filter(([file]) => !file.endsWith('/LoginPage.tsx'))
    .filter(([, source]) => !source.includes('<PageHeader') || source.includes('<h1'))
    .map(([file]) => file)
  expect(Object.keys(pages).length).toBeGreaterThan(10)
  expect(ownTitles).toEqual([])
})

/** Seven pages also sat in their own narrower, centred column with extra padding; <main> already pads. */
it('lets every admin page use the full content width', () => {
  const ownColumn = Object.entries(pages)
    .filter(([, source]) => /className="[^"]*\bmx-auto\b[^"]*\bmax-w-/.test(source))
    .map(([file]) => file)
  expect(ownColumn).toEqual([])
})
