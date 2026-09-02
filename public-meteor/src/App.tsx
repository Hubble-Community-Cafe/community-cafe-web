import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { MenuPage } from './pages/MenuPage'
import { EventsPage } from './pages/EventsPage'
import { CurrentBoardPage, PreviousBoardsPage } from './pages/BoardPage'
import { ComplaintsPage } from './pages/ComplaintsPage'
import { DeclarationsPage } from './pages/DeclarationsPage'
import { DiscountPolicyPage } from './pages/DiscountPolicyPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { NotFoundPage } from './pages/NotFoundPage'

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
        <Route path="/declarations" element={<DeclarationsPage />} />
        <Route path="/menu/discount-policy" element={<DiscountPolicyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App
