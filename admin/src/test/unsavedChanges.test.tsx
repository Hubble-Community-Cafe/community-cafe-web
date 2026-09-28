import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { UnsavedChangesProvider } from '../components/UnsavedChangesProvider'
import { useChangedSince, useUnsavedChangesGuard } from '../lib/unsavedChanges'
import { renderInDataRouter } from './renderInDataRouter'

/** A form as the admin pages have them: local state, guarded by useChangedSince. */
function TitleForm({ initial = 'Pub quiz' }: { initial?: string }) {
  const [title, setTitle] = useState(initial)
  useUnsavedChangesGuard(useChangedSince({ title }))
  return <label>Title <input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
}

function EditPage() {
  const [open, setOpen] = useState(true)
  return (
    <>
      {open && <TitleForm />}
      <button type="button" onClick={() => setOpen(false)}>Save</button>
      <Link to="/other">Other page</Link>
    </>
  )
}

function renderApp() {
  return renderInDataRouter(
    <UnsavedChangesProvider>
      <Routes>
        <Route path="/" element={<EditPage />} />
        <Route path="/other" element={<p>Other page content</p>} />
      </Routes>
    </UnsavedChangesProvider>,
  )
}

function fireBeforeUnload(): boolean {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe('unsaved changes guard', () => {
  it('lets you leave a form you did not change', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('link', { name: 'Other page' }))

    expect(await screen.findByText('Other page content')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(fireBeforeUnload()).toBe(false)
  })

  it('asks before leaving a changed form, and "Keep editing" stays with the input intact', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Title'), ' night')
    await user.click(screen.getByRole('link', { name: 'Other page' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' })
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(dialog).not.toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Pub quiz night')
    expect(screen.queryByText('Other page content')).not.toBeInTheDocument()
  })

  it('Escape also keeps editing', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Title'), '!')
    await user.click(screen.getByRole('link', { name: 'Other page' }))
    await screen.findByRole('alertdialog')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Pub quiz!')
  })

  it('"Discard changes" leaves the page', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Title'), '!')
    await user.click(screen.getByRole('link', { name: 'Other page' }))
    await user.click(await screen.findByRole('button', { name: 'Discard changes' }))

    expect(await screen.findByText('Other page content')).toBeInTheDocument()
  })

  it('typing the original value back counts as unchanged', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Title'), '!')
    await user.type(screen.getByLabelText('Title'), '{Backspace}')
    await user.click(screen.getByRole('link', { name: 'Other page' }))

    expect(await screen.findByText('Other page content')).toBeInTheDocument()
  })

  it('warns when closing or reloading the tab only while there are changes', async () => {
    const user = userEvent.setup()
    renderApp()
    expect(fireBeforeUnload()).toBe(false)

    await user.type(screen.getByLabelText('Title'), '!')
    expect(fireBeforeUnload()).toBe(true)
  })

  it('stops warning once the changed form closes, for example after saving', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Title'), '!')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(fireBeforeUnload()).toBe(false)
    await user.click(screen.getByRole('link', { name: 'Other page' }))
    expect(await screen.findByText('Other page content')).toBeInTheDocument()
  })
})
