import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://35acc991af95f07c6747d6e25d37d628@o4509470338318336.ingest.us.sentry.io/4512256250544128',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <main role="alert">
          Something went wrong. Please refresh the page and try again.
        </main>
      }
    >
      <Provider store={store}>
        <App />
      </Provider>
    </Sentry.ErrorBoundary>
  </StrictMode>
)
