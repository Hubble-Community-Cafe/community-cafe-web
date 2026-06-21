import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageShell } from './components/PageShell'
import { Home } from './pages/Home'
import { MenuPage } from './pages/MenuPage'
import { EventsPage } from './pages/EventsPage'
import { CurrentBoardPage, PreviousBoardsPage } from './pages/BoardPage'
import { ComplaintsPage } from './pages/ComplaintsPage'
import { DiscountPolicyPage } from './pages/DiscountPolicyPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/agenda" element={<EventsPage />} />
        <Route path="/community/board" element={<CurrentBoardPage />} />
        <Route path="/community/board/previous" element={<PreviousBoardsPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/menu/discount-policy" element={<DiscountPolicyPage />} />
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
