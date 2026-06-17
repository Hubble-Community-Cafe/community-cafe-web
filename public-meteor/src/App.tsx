import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageShell } from './components/PageShell'
import { Home } from './pages/Home'

/** Routed pages whose content arrives in later milestones. */
const PLACEHOLDER_PAGES: { path: string; title: string; intro?: string }[] = [
  { path: '/agenda', title: 'Agenda', intro: "What's on at Meteor." },
  { path: '/menu', title: 'Menu' },
  { path: '/menu/discount-policy', title: 'Discount policy' },
  { path: '/complaints', title: 'Complaints & Tips' },
  { path: '/community/board', title: 'Current board' },
  { path: '/community/board/previous', title: 'Previous boards' },
]

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
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
