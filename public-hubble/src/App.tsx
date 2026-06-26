import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { MenuPage } from './pages/MenuPage'
import { DailyDishPage } from './pages/DailyDishPage'
import { EventsPage } from './pages/EventsPage'
import { CurrentBoardPage, PreviousBoardsPage, SupervisoryBoardPage } from './pages/BoardPage'
import { VacanciesPage } from './pages/VacanciesPage'
import { AssociationsPage } from './pages/AssociationsPage'
import { ScreensPage } from './pages/ScreensPage'
import { DeclarationsPage } from './pages/DeclarationsPage'
import { TipsPage } from './pages/TipsPage'
import { InformationPage } from './pages/InformationPage'
import { LoanPage } from './pages/LoanPage'
import { CafePage } from './pages/CafePage'
import { DiscountPolicyPage } from './pages/DiscountPolicyPage'
import { CommitteesPage } from './pages/CommitteesPage'
import { ContactPage } from './pages/ContactPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlazaPage } from './pages/PlazaPage'

function App() {
  return (
    <Routes>
      {/* Full-bleed kiosk screen (the plaza display out front), no header/footer. */}
      <Route path="/plaza-page" element={<PlazaPage />} />
      {/* Everything else renders inside the standard site chrome. */}
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
