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
