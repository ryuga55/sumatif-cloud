import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 pb-20">
          {children}
        </main>
      </div>
      
      {/* Global Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-3 z-10">
        <div className="text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} • Created with ☕ by Rudy Susanto
          </p>
        </div>
      </footer>
    </div>
  )
}