import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
const sentryEnabled = Boolean(sentryDsn)
const sensitiveKeyPattern = /(pass(word)?|token|secret|authorization|cookie|session|api[-_]?key)/i

function sanitizeSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeSensitiveData(entry))
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sensitiveKeyPattern.test(key) ? '[REDACTED]' : sanitizeSensitiveData(entry)
    }

    return sanitized
  }

  return value
}

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend(event) {
      const request = event.request
      const headers = { ...(request?.headers ?? {}) }
      delete headers.authorization
      delete headers.cookie
      delete headers['set-cookie']
      delete headers['x-api-key']

      return {
        ...event,
        user: undefined,
        request: request
          ? {
              ...request,
              headers,
              data: sanitizeSensitiveData(request.data),
            }
          : undefined,
        extra: sanitizeSensitiveData(event.extra) as Record<string, unknown> | undefined,
        contexts: sanitizeSensitiveData(event.contexts) as typeof event.contexts,
      } as typeof event
    },
  })
} else {
  console.info('Sentry disabled: VITE_SENTRY_DSN is not set.')
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (sentryEnabled) {
      Sentry.captureException(error, {
        extra: sanitizeSensitiveData({ componentStack: errorInfo.componentStack }) as Record<string, unknown>,
      })
      return
    }

    console.error('Frontend error captured locally (Sentry disabled):', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-sm text-red-700">
          Une erreur inattendue est survenue. Merci de recharger la page.
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
)
