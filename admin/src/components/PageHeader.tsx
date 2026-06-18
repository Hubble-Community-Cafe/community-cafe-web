import type { ReactNode } from 'react'

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-title text-2xl font-bold text-slate-800 md:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
}
