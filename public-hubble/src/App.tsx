import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { NotFoundPage } from './pages/NotFoundPage'

// The home page and the layout are in the main bundle; every other page downloads when it is first
// opened, so a visitor on the home page or the menu does not load the forms, ALTCHA or the kiosk.
const MenuPage = lazy(() => import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })))
const DailyDishPage = lazy(() => import('./pages/DailyDishPage').then((m) => ({ default: m.DailyDishPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const CurrentBoardPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.CurrentBoardPage })))
const PreviousBoardsPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.PreviousBoardsPage })))
const SupervisoryBoardPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.SupervisoryBoardPage })))
const VacanciesPage = lazy(() => import('./pages/VacanciesPage').then((m) => ({ default: m.VacanciesPage })))
const AssociationsPage = lazy(() => import('./pages/AssociationsPage').then((m) => ({ default: m.AssociationsPage })))
const ScreensPage = lazy(() => import('./pages/ScreensPage').then((m) => ({ default: m.ScreensPage })))
const DeclarationsPage = lazy(() => import('./pages/DeclarationsPage').then((m) => ({ default: m.DeclarationsPage })))
const TipsPage = lazy(() => import('./pages/TipsPage').then((m) => ({ default: m.TipsPage })))
const InformationPage = lazy(() => import('./pages/InformationPage').then((m) => ({ default: m.InformationPage })))
const LoanPage = lazy(() => import('./pages/LoanPage').then((m) => ({ default: m.LoanPage })))
const CafePage = lazy(() => import('./pages/CafePage').then((m) => ({ default: m.CafePage })))
const DiscountPolicyPage = lazy(() => import('./pages/DiscountPolicyPage').then((m) => ({ default: m.DiscountPolicyPage })))
const CommitteesPage = lazy(() => import('./pages/CommitteesPage').then((m) => ({ default: m.CommitteesPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const PlazaPage = lazy(() => import('./pages/PlazaPage').then((m) => ({ default: m.PlazaPage })))

function App() {
  return (
    <Routes>
      {/* Full-bleed kiosk screen (the plaza display out front), no header/footer. */}
      <Route path="/plaza-page" element={<Suspense fallback={null}><PlazaPage /></Suspense>} />
      {/* Everything else renders inside the standard site chrome (which holds the Suspense). */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cafe" element={<CafePage />} />
        <Route path="/cafe/menu" element={<MenuPage />} />
        <Route path="/cafe/discount-policy" element={<DiscountPolicyPage />} />
        <Route path="/community/committees" element={<CommitteesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cafe/daily-dish" element={<DailyDishPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/community/board" element={<CurrentBoardPage />} />
        <Route path="/community/board/previous" element={<PreviousBoardsPage />} />
        <Route path="/community/board/supervisory" element={<SupervisoryBoardPage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route path="/community/associations" element={<AssociationsPage />} />
        <Route path="/contact/screens" element={<ScreensPage />} />
        <Route path="/contact/declarations" element={<DeclarationsPage />} />
        <Route path="/contact/tips" element={<TipsPage />} />
        <Route path="/contact/information" element={<InformationPage />} />
        <Route path="/contact/loan-equipment" element={<LoanPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
