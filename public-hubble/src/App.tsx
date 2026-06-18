import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageShell } from './components/PageShell'
import { Home } from './pages/Home'
import { MenuPage } from './pages/MenuPage'
import { DailyDishPage } from './pages/DailyDishPage'

/** Routed pages whose content arrives in later milestones. */
const PLACEHOLDER_PAGES: { path: string; title: string; intro?: string }[] = [
  { path: '/cafe', title: 'The Cafe', intro: 'About Hubble Community Cafe.' },
  { path: '/cafe/discount-policy', title: 'Discount policy' },
  { path: '/community/associations', title: 'Associations' },
  { path: '/community/committees', title: 'Committees' },
  { path: '/community/board', title: 'Board' },
  { path: '/community/board/previous', title: 'Previous boards' },
  { path: '/community/board/supervisory', title: 'Supervisory Board' },
  { path: '/events', title: 'Events' },
  { path: '/vacancies', title: 'Vacancies' },
  { path: '/contact', title: 'Contact' },
  { path: '/contact/tips', title: 'Tips, Complaints and Ideas' },
  { path: '/contact/information', title: 'Information form' },
  { path: '/contact/declarations', title: 'Online Declarations' },
  { path: '/contact/screens', title: 'Hubble Screens' },
  { path: '/contact/loan-equipment', title: 'Loan Equipment' },
]

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cafe/menu" element={<MenuPage />} />
        <Route path="/cafe/daily-dish" element={<DailyDishPage />} />
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
