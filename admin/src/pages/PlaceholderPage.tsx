import { Card, PageHeader } from '../components/PageHeader'

/** A content module that has a route and nav entry but is not built yet. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="Manage this content for both cafes." />
      <Card>
        <p className="text-sm text-slate-500">
          This module is being built and will be available soon. It will let staff and board edit
          {' '}
          {title.toLowerCase()} for Hubble and Meteor from one place.
        </p>
      </Card>
    </>
  )
}
