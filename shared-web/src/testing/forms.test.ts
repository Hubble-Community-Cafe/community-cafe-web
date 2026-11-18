import { describe, expect, it } from 'vitest'
import { unannouncedErrors } from './forms'

describe('unannouncedErrors', () => {
  it('finds an error shown without role="alert", by file and line', () => {
    const sources = {
      'Page.tsx': 'return (\n  <div>\n    {error && <p className="text-red-600">{error}</p>}\n  </div>\n)',
      'Form.tsx': '{saveError && (\n  <div className="bg-red-50">\n    {saveError}\n  </div>\n)}',
    }
    expect(unannouncedErrors(sources)).toEqual(['Page.tsx:3', 'Form.tsx:1'])
  })

  it('accepts errors that are announced, on one line or several', () => {
    const sources = {
      'Page.tsx': '{error && <p role="alert" className="text-red-600">{error}</p>}',
      'Form.tsx': '{loadError && (\n  <div role="alert" className="bg-red-50">{loadError}</div>\n)}',
    }
    expect(unannouncedErrors(sources)).toEqual([])
  })

  it('leaves other conditions alone', () => {
    expect(unannouncedErrors({ 'Home.tsx': '{loaded && !hoursError && <p>Closed today</p>}' })).toEqual([])
  })
})
