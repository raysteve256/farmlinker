import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

// Explicit control over PWA updates: when a new version is deployed, force
// the waiting service worker to activate and reload the page immediately
// instead of leaving the user stuck on a stale cached build until they
// happen to fully close every tab. Also re-checks for updates whenever the
// tab regains focus, since installed/backgrounded PWAs won't otherwise
// notice a new deploy went out.
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() { updateSW(true) },
    onRegisteredSW(_url, registration) {
      if (!registration) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
