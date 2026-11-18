import { lazy, type ComponentType, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { Loader2, ShieldX } from 'lucide-react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { AccessLoadFailed } from './components/AccessLoadFailed'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { RoleProvider, useRole } from './lib/RoleContext'
import { usePermissions } from './lib/usePermissions'
import { useGroupAuthorization } from './lib/useGroupAuthorization'
import { isE2E } from './lib/e2eAuth'
import { canAccess, NAV_ITEMS, type NavPath, type NavRequirement } from './navigation'

// The layout, sign-in and dashboard are in the main bundle; each editor downloads when it is first
// opened (the menu editor brings the drag-and-drop library). The Suspense is in Layout.
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })))
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })))
const MenuPage = lazy(() => import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })))
const DailyDishPage = lazy(() => import('./pages/DailyDishPage').then((m) => ({ default: m.DailyDishPage })))
const OpeningHoursPage = lazy(() => import('./pages/OpeningHoursPage').then((m) => ({ default: m.OpeningHoursPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const MediaPage = lazy(() => import('./pages/MediaPage').then((m) => ({ default: m.MediaPage })))
const BoardPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.BoardPage })))
const VacanciesPage = lazy(() => import('./pages/VacanciesPage').then((m) => ({ default: m.VacanciesPage })))
const AssociationsPage = lazy(() => import('./pages/AssociationsPage').then((m) => ({ default: m.AssociationsPage })))
const ScreensPage = lazy(() => import('./pages/ScreensPage').then((m) => ({ default: m.ScreensPage })))

type PagePath = Exclude<NavPath, '/'>

/**
 * The page behind each nav path. Who may open it comes from its nav item (navigation.ts), so the
 * menu and the route can never disagree; the dashboard is the index route.
 */
export const PAGES: Record<PagePath, ComponentType> = {
  '/menu': MenuPage,
  '/daily-dish': DailyDishPage,
  '/hours': OpeningHoursPage,
  '/events': EventsPage,
  '/board': BoardPage,
  '/vacancies': VacanciesPage,
  '/associations': AssociationsPage,
  '/media': MediaPage,
  '/screens': ScreensPage,
  '/users': UsersPage,
  '/audit': AuditLogPage,
}

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
  const { user, isLoading: isLoadingRole, error: roleError, refetch } = useRole()

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

  // Their record (and so their access) failed to load and none was loaded before: say so, rather
  // than let every page treat it as "no access". A failed refresh later keeps them working.
  if (roleError && !user && !isLoadingRole) {
    return <AccessLoadFailed onRetry={refetch} />
  }

  return <>{children}</>
}

/** Gates a route on the database-backed access, by its nav item's requirement. Editing is gated
 *  inside each page. */
function RequireAccess({ requires, children }: { requires?: NavRequirement; children: ReactNode }) {
  const { isLoading } = useRole()
  const permissions = usePermissions()

  if (isLoading) {
    return (
      <FullScreen>
        <Loader2 className="h-8 w-8 animate-spin text-hubble-500" />
      </FullScreen>
    )
  }
  return canAccess(requires, permissions) ? <>{children}</> : <Navigate to="/" replace />
}

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
            {NAV_ITEMS.filter((item) => item.to !== '/').map((item) => {
              const Page = PAGES[item.to as PagePath]
              return (
                <Route
                  key={item.to}
                  path={item.to.slice(1)}
                  element={<RequireAccess requires={item.requires}><Page /></RequireAccess>}
                />
              )
            })}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RoleProvider>
    </ErrorBoundary>
  )
}

export default App
