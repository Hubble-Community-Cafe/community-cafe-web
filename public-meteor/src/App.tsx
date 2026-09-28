import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { NotFoundPage } from './pages/NotFoundPage'

// The home page and the layout are in the main bundle; every other page downloads when it is first
// opened, so a visitor on the home page or the menu does not load the forms or ALTCHA.
const MenuPage = lazy(() => import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const CurrentBoardPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.CurrentBoardPage })))
const PreviousBoardsPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.PreviousBoardsPage })))
const ComplaintsPage = lazy(() => import('./pages/ComplaintsPage').then((m) => ({ default: m.ComplaintsPage })))
const DeclarationsPage = lazy(() => import('./pages/DeclarationsPage').then((m) => ({ default: m.DeclarationsPage })))
const DiscountPolicyPage = lazy(() => import('./pages/DiscountPolicyPage').then((m) => ({ default: m.DiscountPolicyPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))

function App() {
  return (
    // The layout holds the Suspense boundary, so the header and footer stay while a page loads.
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/agenda" element={<EventsPage />} />
        <Route path="/community/board" element={<CurrentBoardPage />} />
        <Route path="/community/board/previous" element={<PreviousBoardsPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/declarations" element={<DeclarationsPage />} />
        <Route path="/menu/discount-policy" element={<DiscountPolicyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App
