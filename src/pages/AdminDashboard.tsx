import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { LicenseKey, User } from '../lib/supabase'
import { Plus, Key, Users, CheckCircle, XCircle, UserCheck, Clock, Trash2, Edit, Mail, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface ExtendedUser extends User {
  license_status: 'none' | 'assigned' | 'pending'
}

export function AdminDashboard() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([])
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState({
    totalLicenses: 0,
    usedLicenses: 0,
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchLicenses(),
        fetchUsers(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Add license status to each user
      const usersWithStatus: ExtendedUser[] = (data || []).map(user => ({
        ...user,
        license_status: user.license_key ? 'assigned' : 'none'
      }))
      
      setUsers(usersWithStatus)
    } catch (error: any) {
      toast.error('Error fetching users: ' + error.message)
    }
  }

  const fetchStats = async () => {
    try {
      const [
        { count: totalLicenses },
        { count: usedLicenses },
        { count: totalUsers },
        { count: pendingUsers },
        { count: activeUsers }
      ] = await Promise.all([
        supabase.from('license_keys').select('*', { count: 'exact' }),
        supabase.from('license_keys').select('*', { count: 'exact' }).eq('is_used', true),
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('users').select('*', { count: 'exact' }).is('license_key', null),
        supabase.from('users').select('*', { count: 'exact' }).not('license_key', 'is', null)
      ])

      setStats({
        totalLicenses: totalLicenses || 0,
        usedLicenses: usedLicenses || 0,
        totalUsers: totalUsers || 0,
        pendingUsers: pendingUsers || 0,
        activeUsers: activeUsers || 0
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

  const handleAssignLicense = (user: ExtendedUser) => {
    setSelectedUser(user)
    setLicenseKey(user.license_key || generateLicenseKey())
    setShowLicenseModal(true)
  }

  const confirmLicenseAssignment = async () => {
    if (!selectedUser || !licenseKey.trim()) {
      toast.error('License key harus diisi')
      return
    }

    setUpdating(true)
    try {
      // Check if this is a new license key or updating existing one
      if (!selectedUser.license_key) {
        // Create new license key record
        const { error: licenseError } = await supabase
          .from('license_keys')
          .insert([{
            key: licenseKey,
            is_used: true,
            assigned_user_id: selectedUser.id
          }])

        if (licenseError) throw licenseError
      } else {
        // Update existing license key
        const { error: licenseError } = await supabase
          .from('license_keys')
          .update({ key: licenseKey })
          .eq('assigned_user_id', selectedUser.id)

        if (licenseError) throw licenseError
      }

      // Update user with license key
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          license_key: licenseKey,
          verified: true
        })
        .eq('id', selectedUser.id)

      if (userError) throw userError

      toast.success(`License key berhasil ${selectedUser.license_key ? 'diupdate' : 'diberikan'} untuk ${selectedUser.email}`)
      setShowLicenseModal(false)
      setSelectedUser(null)
      setLicenseKey('')
      fetchData()
    } catch (error: any) {
      toast.error('Error assigning license: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async (user: ExtendedUser) => {
    if (!confirm(`Yakin ingin menghapus user ${user.email}? Tindakan ini tidak dapat dibatalkan.`)) return

    try {
      // Delete associated license key if exists
      if (user.license_key) {
        await supabase
          .from('license_keys')
          .delete()
          .eq('assigned_user_id', user.id)
      }

      // Delete user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) throw error
      
      toast.success(`User ${user.email} berhasil dihapus`)
      fetchData()
    } catch (error: any) {
      toast.error('Error deleting user: ' + error.message)
    }
  }

  const getUserStatusBadge = (user: ExtendedUser) => {
    if (user.role === 'admin') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </span>
      )
    }
    
    if (user.license_key) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    )
  }

  const statCards = [
    { icon: Key, label: 'Total License Keys', value: stats.totalLicenses, color: 'bg-blue-500' },
    { icon: CheckCircle, label: 'License Terpakai', value: stats.usedLicenses, color: 'bg-green-500' },
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'bg-purple-500' },
    { icon: UserCheck, label: 'Active Users', value: stats.activeUsers, color: 'bg-indigo-500' },
    { icon: Clock, label: 'Pending Users', value: stats.pendingUsers, color: 'bg-orange-500' }
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{card.label}</p>
                    <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${card.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      {stats.pendingUsers > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">
                    {stats.pendingUsers} User Menunggu License Key
                  </h3>
                  <p className="text-orange-700">Ada user baru yang perlu diberi license key untuk mengakses aplikasi</p>
                </div>
              </div>
              <Link to="/user-approval">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Kelola Users
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Manajemen Users</h3>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">{users.length} users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">License Key</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tanggal Daftar</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getUserStatusBadge(user)}
                    </td>
                    <td className="py-3 px-4">
                      {user.license_key ? (
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {user.license_key}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {user.role !== 'admin' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAssignLicense(user)}
                            title={user.license_key ? 'Edit License Key' : 'Assign License Key'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada user yang terdaftar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Keys Table */}
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
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Assigned To</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => {
                  const assignedUser = users.find(u => u.id === license.assigned_user_id)
                  return (
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
                        {assignedUser ? assignedUser.email : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(license.created_at).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* License Assignment Modal */}
      <Modal
        isOpen={showLicenseModal}
        onClose={() => {
          setShowLicenseModal(false)
          setSelectedUser(null)
          setLicenseKey('')
        }}
        title={selectedUser?.license_key ? 'Edit License Key' : 'Assign License Key'}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">User Information</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Current License:</strong> {selectedUser.license_key || 'None'}</p>
                <p><strong>Status:</strong> {selectedUser.verified ? 'Verified' : 'Not Verified'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                License Key
              </label>
              <div className="flex space-x-2">
                <Input
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="Masukkan license key"
                  className="font-mono text-center tracking-widest"
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setLicenseKey(generateLicenseKey())}
                >
                  <Key className="w-4 h-4 mr-1" />
                  Generate
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">
                    {selectedUser.license_key ? 'Update License Key' : 'Assign License Key'}
                  </p>
                  <p>
                    {selectedUser.license_key 
                      ? 'License key akan diupdate dan user dapat terus mengakses aplikasi.'
                      : 'User akan dapat mengakses aplikasi setelah license key diberikan.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowLicenseModal(false)
                  setSelectedUser(null)
                  setLicenseKey('')
                }}
              >
                Batal
              </Button>
              <Button
                onClick={confirmLicenseAssignment}
                disabled={!licenseKey.trim() || updating}
                className="bg-green-600 hover:bg-green-700"
              >
                {updating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {selectedUser.license_key ? 'Update' : 'Assign'} License
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}