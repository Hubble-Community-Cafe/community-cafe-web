import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageShell } from './components/PageShell'
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

/** Routed pages whose content arrives in later milestones. */
const PLACEHOLDER_PAGES: { path: string; title: string; intro?: string }[] = [
  { path: '/cafe', title: 'The Cafe', intro: 'About Hubble Community Cafe.' },
  { path: '/cafe/discount-policy', title: 'Discount policy' },
  { path: '/community/committees', title: 'Committees' },
  { path: '/contact', title: 'Contact' },
]

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cafe/menu" element={<MenuPage />} />
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
        {PLACEHOLDER_PAGES.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<PageShell title={page.title} intro={page.intro} placeholder />}
          />
        ))}
        <Route
          path="*"
          element={
            <PageShell
              title="Page not found"
              intro="The page you were looking for does not exist."
            />
          }
        />
      </Routes>
    </Layout>
  )
}

export default App
