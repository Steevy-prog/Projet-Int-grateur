import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import { cn }  from '@/lib/utils'

interface PageWrapperProps {
  children:  React.ReactNode
  title?:    string
  subtitle?: string
}

export default function PageWrapper({ children, title, subtitle }: PageWrapperProps) {
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? '64px' : '240px'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Topbar */}
      <Topbar sidebarCollapsed={collapsed} />

      {/* Main content */}
      <main
        className="transition-all duration-300 min-h-screen"
        style={{
          marginLeft: sidebarWidth,
          paddingTop: 'var(--topbar-height)',
        }}
      >
        <div className="p-6 page-enter">
          {/* Page header */}
          {title && (
            <div className="mb-6">
              <h1
                className="font-display text-2xl font-800 tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Page body */}
          {children}
        </div>
      </main>
    </div>
  )
}
