import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuroraBackground } from './components/ui/AuroraBackground'
import { ConnectionBanner } from './components/ui/ConnectionBanner'
import { CustomCursor } from './components/ui/CustomCursor'
import { ToastContainer } from './components/ui/Toast'
import { showToast } from './lib/toast'
import { SiteFooter } from './components/SiteFooter'
import { ThemeToggle } from './components/ui/ThemeToggle'
import { AboutPage } from './pages/AboutPage'
import { CollectionCreatePage } from './pages/CollectionCreatePage'
import { CollectionViewPage } from './pages/CollectionViewPage'
import { CollectionsDiscoverPage } from './pages/CollectionsDiscoverPage'
import { ContactPage } from './pages/ContactPage'
import { FaqPage } from './pages/FaqPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { HomePage } from './pages/HomePage'
import { FeedsPage } from './pages/FeedsPage'
import { PostPreviewPage } from './pages/PostPreviewPage'
import { startConnectionMonitor, onConnectionChange } from './lib/connection'
import { trySyncPending } from './lib/collections'
import { env } from './lib/env'

type Theme = 'dark' | 'light'
type RazorpayStatus = 'checking' | 'working' | 'unavailable'

const THEME_KEY = 'articlex-theme'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

function getInitialRazorpayStatus(): RazorpayStatus {
  if (typeof window === 'undefined') return 'checking'
  const key = env.razorpayKeyId
  if (!key) return 'unavailable'
  if (window.Razorpay) return 'working'
  return 'checking'
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'ArticleX',
  '/features': 'Features · ArticleX',
  '/about': 'About · ArticleX',
  '/contact': 'Contact · ArticleX',
  '/faq': 'FAQ · ArticleX',
  '/collections': 'Collections · ArticleX',
  '/collections/new': 'Create Collection · ArticleX',
  '/feeds': 'Feeds · ArticleX',
}

function RouteSideEffects() {
  const location = useLocation()

  useEffect(() => {
    const title = location.pathname.startsWith('/collections/')
      ? 'Collection · ArticleX'
      : location.pathname.startsWith('/posts/')
        ? 'Preview · ArticleX'
        : PAGE_TITLES[location.pathname] ?? 'ArticleX'
    document.title = title
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

function AppRoutes({
  theme,
  toggleTheme,
  homePage,
}: {
  theme: Theme
  toggleTheme: () => void
  homePage: ReactElement
}) {
  const location = useLocation()
  const isImmersivePreview = location.pathname.startsWith('/posts/')

  return (
    <>
      {!isImmersivePreview ? <ThemeToggle theme={theme} onToggle={toggleTheme} /> : null}
      <RouteSideEffects />
      <Routes>
        <Route path="/" element={homePage} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/collections" element={<CollectionsDiscoverPage />} />
        <Route path="/collections/new" element={<CollectionCreatePage />} />
        <Route path="/collections/:id" element={<CollectionViewPage />} />
        <Route path="/posts/:tweetId" element={<PostPreviewPage />} />
        <Route path="/feeds" element={<FeedsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isImmersivePreview ? <SiteFooter /> : null}
    </>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [razorpayStatus, setRazorpayStatus] = useState<RazorpayStatus>(getInitialRazorpayStatus)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const key = env.razorpayKeyId
    if (!key || window.Razorpay) return
    const script = document.querySelector('script[src*="checkout.razorpay.com/v1/checkout.js"]')
    if (!(script instanceof HTMLScriptElement)) return
    const onReady = () => setRazorpayStatus(window.Razorpay ? 'working' : 'unavailable')
    const onError = () => setRazorpayStatus('unavailable')
    const timeout = window.setTimeout(() => setRazorpayStatus(window.Razorpay ? 'working' : 'unavailable'), 6000)
    script.addEventListener('load', onReady)
    script.addEventListener('error', onError)
    return () => {
      window.clearTimeout(timeout)
      script.removeEventListener('load', onReady)
      script.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    startConnectionMonitor()
    let hadIssue = false
    const unsub = onConnectionChange((status) => {
      if ((status === 'offline' || status === 'backend-issue') && !hadIssue) {
        hadIssue = true
        if (status === 'offline') {
          showToast('offline', 'No internet — your work is saved locally.')
        } else {
          showToast('warning', 'Service temporarily unavailable. Your data is safe locally.')
        }
      }
      if (status === 'online' && hadIssue) {
        hadIssue = false
        showToast('success', 'Connection restored — welcome back!')
        void trySyncPending()
      }
    })
    return unsub
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const homePage = useMemo(
    () => <HomePage razorpayStatus={razorpayStatus} />,
    [razorpayStatus],
  )

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg-base">
      <AuroraBackground />
      <CustomCursor />
      <ConnectionBanner />
      <ToastContainer />
      <HashRouter>
        <AppRoutes theme={theme} toggleTheme={toggleTheme} homePage={homePage} />
      </HashRouter>
    </div>
  )
}

export default App
