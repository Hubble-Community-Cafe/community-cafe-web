import { type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { Loader2, ShieldX } from 'lucide-react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { MenuPage } from './pages/MenuPage'
import { DailyDishPage } from './pages/DailyDishPage'
import { OpeningHoursPage } from './pages/OpeningHoursPage'
import { EventsPage } from './pages/EventsPage'
import { MediaPage } from './pages/MediaPage'
import { BoardPage } from './pages/BoardPage'
import { VacanciesPage } from './pages/VacanciesPage'
import { AssociationsPage } from './pages/AssociationsPage'
import { ScreensPage } from './pages/ScreensPage'
import { RoleProvider, useRole } from './lib/RoleContext'
import { usePermissions } from './lib/usePermissions'
import { useGroupAuthorization } from './lib/useGroupAuthorization'
import { isE2E } from './lib/e2eAuth'

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">{children}</div>
  )
}

/** Gates the whole app behind Microsoft sign-in + Entra group membership. */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isMsalAuthenticated = useIsAuthenticated()
  const e2e = isE2E()
  const isAuthenticated = isMsalAuthenticated || e2e
  const { isLoading: isCheckingGroup, isAuthorized, error: groupError } = useGroupAuthorization()

  if (isAuthenticated && !e2e && isCheckingGroup) {
    return (
      <FullScreen>
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-hubble-500" />
          <p className="text-slate-500">Verifying access…</p>
        </div>
      </FullScreen>
    )
  }

  if (isAuthenticated && !e2e && !isAuthorized) {
    return (
      <FullScreen>
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500">
            <ShieldX className="h-7 w-7" />
          </span>
          <h1 className="font-title text-xl font-bold text-slate-800">Access denied</h1>
          <p className="mt-2 text-sm text-slate-500">
            {groupError ?? 'You are not authorized to access this application.'}
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.clear()
              window.location.href = '/login'
            }}
            className="mt-6 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Sign out and try again
          </button>
        </div>
      </FullScreen>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Gates a route on the database-backed role. Content pages use 'viewer' (read-only
 *  for viewers; editing is gated inside each page by capability). */
function RequireRole({ need, children }: { need: 'viewer' | 'editor' | 'admin'; children: ReactNode }) {
  const { isLoading } = useRole()
  const { isViewer, isEditor, isAdmin } = usePermissions()

  if (isLoading) {
    return (
      <FullScreen>
        <Loader2 className="h-8 w-8 animate-spin text-hubble-500" />
      </FullScreen>
    )
  }
  const allowed = need === 'admin' ? isAdmin : need === 'editor' ? isEditor : isViewer
  return allowed ? <>{children}</> : <Navigate to="/" replace />
}

const CONTENT_MODULES: { path: string; title: string }[] = []

function App() {
  return (
    <ErrorBoundary>
      <RoleProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="menu"
              element={
                <RequireRole need="viewer">
                  <MenuPage />
                </RequireRole>
              }
            />
            <Route
              path="daily-dish"
              element={
                <RequireRole need="viewer">
                  <DailyDishPage />
                </RequireRole>
              }
            />
            <Route
              path="hours"
              element={
                <RequireRole need="viewer">
                  <OpeningHoursPage />
                </RequireRole>
              }
            />
            <Route
              path="events"
              element={
                <RequireRole need="viewer">
                  <EventsPage />
                </RequireRole>
              }
            />
            <Route
              path="board"
              element={
                <RequireRole need="viewer">
                  <BoardPage />
                </RequireRole>
              }
            />
            <Route
              path="vacancies"
              element={
                <RequireRole need="viewer">
                  <VacanciesPage />
                </RequireRole>
              }
            />
            <Route
              path="associations"
              element={
                <RequireRole need="viewer">
                  <AssociationsPage />
                </RequireRole>
              }
            />
            <Route
              path="media"
              element={
                <RequireRole need="viewer">
                  <MediaPage />
                </RequireRole>
              }
            />
            {/* Switching the screens is a bar-shift action, open to any signed-in staff. */}
            <Route path="screens" element={<ScreensPage />} />
            {CONTENT_MODULES.map((m) => (
              <Route
                key={m.path}
                path={m.path}
                element={
                  <RequireRole need="viewer">
                    <PlaceholderPage title={m.title} />
                  </RequireRole>
                }
              />
            ))}
            <Route
              path="users"
              element={
                <RequireRole need="admin">
                  <UsersPage />
                </RequireRole>
              }
            />
            <Route
              path="audit"
              element={
                <RequireRole need="admin">
                  <AuditLogPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RoleProvider>
    </ErrorBoundary>
  )
}

export default App
