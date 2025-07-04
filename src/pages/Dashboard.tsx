import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Users, BookOpen, GraduationCap, FileText } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface DashboardStats {
  totalClasses: number
  activeClasses: number
  totalStudents: number
  totalSubjects: number
  totalCategories: number
  totalScores: number
}

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    activeClasses: 0,
    totalStudents: 0,
    totalSubjects: 0,
    totalCategories: 0,
    totalScores: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    if (!user) return

    try {
      const [
        { count: totalClasses },
        { count: activeClasses },
        { count: totalStudents },
        { count: totalSubjects },
        { count: totalCategories },
        { count: totalScores }
      ] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('classes').select('*', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('students').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('subjects').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('categories').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('scores').select('*', { count: 'exact' }).eq('user_id', user.id)
      ])

      setStats({
        totalClasses: totalClasses || 0,
        activeClasses: activeClasses || 0,
        totalStudents: totalStudents || 0,
        totalSubjects: totalSubjects || 0,
        totalCategories: totalCategories || 0,
        totalScores: totalScores || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: Users, label: 'Total Kelas', value: stats.totalClasses, color: 'bg-blue-500' },
    { icon: Users, label: 'Kelas Aktif', value: stats.activeClasses, color: 'bg-green-500' },
    { icon: GraduationCap, label: 'Total Siswa', value: stats.totalStudents, color: 'bg-purple-500' },
    { icon: BookOpen, label: 'Mata Pelajaran', value: stats.totalSubjects, color: 'bg-orange-500' },
    { icon: FileText, label: 'Kategori Penilaian', value: stats.totalCategories, color: 'bg-red-500' },
    { icon: FileText, label: 'Total Nilai', value: stats.totalScores, color: 'bg-indigo-500' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Selamat datang kembali!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Sistem berhasil dimuat</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Dashboard siap digunakan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <p className="font-medium">Tambah Siswa Baru</p>
                <p className="text-sm text-gray-600">Daftarkan siswa ke kelas</p>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <p className="font-medium">Input Nilai</p>
                <p className="text-sm text-gray-600">Masukkan nilai siswa</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}