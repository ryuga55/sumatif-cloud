import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AuthForm } from './components/auth/AuthForm'
import { LicenseVerification } from './components/auth/LicenseVerification'
import { Layout } from './components/ui/Layout'
import { Dashboard } from './pages/Dashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { Classes } from './pages/Classes'
import { Students } from './pages/Students'
import { Subjects } from './pages/Subjects'
import { Categories } from './pages/Categories'
import { Weights } from './pages/Weights'
import { Scores } from './pages/Scores'
import { AttendancePage } from './pages/Attendance'
import { Reports } from './pages/Reports'
import { Backup } from './pages/Backup'

function App() {
  const { user, loading } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    } else {
      setProfileLoading(false)
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        // User exists
        setUserProfile(data[0])
      } else {
        // User doesn't exist in users table, create it
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            role: 'user',
            verified: user.email_confirmed_at ? true : false
          }])
          .select('*')
          .single()

        if (insertError) throw insertError
        setUserProfile(newUser)
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-slate-700 mb-2">SUMATIF CLOUD</h1>
            <p className="text-slate-500">Memuat aplikasi...</p>
          </div>
        </div>
        <footer className="py-6 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} • Created with ☕ by Rudy Susanto
          </p>
        </footer>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster position="top-right" />
      </>
    )
  }

  // Email not verified
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Branding Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-700 mb-3 tracking-tight">
                SUMATIF CLOUD
              </h1>
              <p className="text-lg text-slate-500 font-medium">
                Terhubung. Tersimpan. Tertata.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Verifikasi Email
              </h2>
              <p className="text-slate-600">
                Silakan cek email Anda dan klik link verifikasi untuk melanjutkan.
              </p>
            </div>
          </div>
        </div>
        <footer className="py-6 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} • Created with ☕ by Rudy Susanto
          </p>
        </footer>
        <Toaster position="top-right" />
      </div>
    )
  }

  // User needs license verification
  if (userProfile && userProfile.role === 'user' && !userProfile.license_key) {
    return (
      <>
        <LicenseVerification userId={user.id} onSuccess={fetchUserProfile} />
        <Toaster position="top-right" />
      </>
    )
  }

  // Admin or verified user
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              userProfile?.role === 'admin' ? <AdminDashboard /> : <Dashboard />
            } 
          />
          <Route path="/classes" element={<Classes />} />
          <Route path="/students" element={<Students />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/weights" element={<Weights />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/backup" element={<Backup />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </Router>
  )
}

export default App