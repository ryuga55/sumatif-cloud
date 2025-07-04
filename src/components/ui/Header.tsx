import { User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 relative z-50">
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        <h1 className="text-lg lg:text-xl font-semibold text-gray-800">SUMATIF CLOUD</h1>
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="hidden sm:flex items-center space-x-2">
          <User className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
          <span className="text-xs lg:text-sm text-gray-700 truncate max-w-32 lg:max-w-none">
            {user?.email}
          </span>
        </div>
        
        <button
          onClick={signOut}
          className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  )
}