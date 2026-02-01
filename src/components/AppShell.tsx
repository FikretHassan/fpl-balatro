'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

export default function AppShell({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <ErrorBoundary>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-mult text-white text-center py-2 text-xs font-semibold">
          You are offline — some features may not work
        </div>
      )}
      {children}
    </ErrorBoundary>
  )
}
