import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  UserCheck, 
  BookOpen, 
  Tags, 
  Scale, 
  FileText, 
  Calendar,
  BarChart3,
  Download,
  ClipboardList
} from 'lucide-react'

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Kelas', path: '/classes' },
  { icon: UserCheck, label: 'Siswa', path: '/students' },
  { icon: BookOpen, label: 'Mata Pelajaran', path: '/subjects' },
  { icon: Tags, label: 'Kategori Penilaian', path: '/categories' },
  { icon: Scale, label: 'Bobot Penilaian', path: '/weights' },
  { icon: FileText, label: 'Input Nilai', path: '/scores' },
  { icon: Calendar, label: 'Input Kehadiran', path: '/attendance' },
  { icon: BarChart3, label: 'Rekap Nilai', path: '/reports' },
  { icon: ClipboardList, label: 'Rekap Kehadiran', path: '/attendance-reports' },
  { icon: Download, label: 'Backup & Restore', path: '/backup' },
]

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}