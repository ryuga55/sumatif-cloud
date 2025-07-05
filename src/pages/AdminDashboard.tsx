import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LicenseKey } from '../lib/supabase'
import { Plus, Key, Users, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export function AdminDashboard() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLicenses: 0,
    usedLicenses: 0,
    totalUsers: 0
  })

  useEffect(() => {
    fetchLicenses()
    fetchStats()
  }, [])

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLicenses(data || [])
    } catch (error: any) {
      toast.error('Error fetching licenses: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [
        { count: totalLicenses },
        { count: usedLicenses },
        { count: totalUsers }
      ] = await Promise.all([
        supabase.from('license_keys').select('*', { count: 'exact' }),
        supabase.from('license_keys').select('*', { count: 'exact' }).eq('is_used', true),
        supabase.from('users').select('*', { count: 'exact' })
      ])

      setStats({
        totalLicenses: totalLicenses || 0,
        usedLicenses: usedLicenses || 0,
        totalUsers: totalUsers || 0
      })
    } catch (error: any) {
      toast.error('Error fetching stats: ' + error.message)
    }
  }

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleGenerateLicense = async () => {
    try {
      const newKey = generateLicenseKey()
      
      const { error } = await supabase
        .from('license_keys')
        .insert([{
          key: newKey,
          is_used: false
        }])

      if (error) throw error
      
      toast.success(`License key ${newKey} berhasil dibuat!`)
      fetchLicenses()
      fetchStats()
    } catch (error: any) {
      toast.error('Error generating license: ' + error.message)
    }
  }

  const statCards = [
    { icon: Key, label: 'Total License Keys', value: stats.totalLicenses, color: 'bg-blue-500' },
    { icon: CheckCircle, label: 'License Terpakai', value: stats.usedLicenses, color: 'bg-green-500' },
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'bg-purple-500' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button onClick={handleGenerateLicense}>
          <Plus className="w-4 h-4 mr-2" />
          Generate License Key
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">License Keys</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Key</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">User ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">{license.key}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        license.is_used 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {license.is_used ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Used
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {license.assigned_user_id || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(license.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}