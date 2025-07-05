import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { User } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { UserCheck, Clock, CheckCircle, XCircle, Key, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface PendingUser extends User {
  pending_license_key?: string
}

export function UserApproval() {
  const { user } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    fetchPendingUsers()
  }, [user])

  const fetchPendingUsers = async () => {
    if (!user) return

    try {
      // Get users who don't have license keys (pending approval)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user')
        .is('license_key', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingUsers(data || [])
    } catch (error: any) {
      toast.error('Error fetching pending users: ' + error.message)
    } finally {
      setLoading(false)
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

  const handleApproveUser = (user: PendingUser) => {
    setSelectedUser(user)
    setLicenseKey(generateLicenseKey()) // Auto-generate license key
    setShowModal(true)
  }

  const confirmApproval = async () => {
    if (!selectedUser || !licenseKey.trim()) {
      toast.error('License key harus diisi')
      return
    }

    setApproving(true)
    try {
      // First, create the license key record
      const { error: licenseError } = await supabase
        .from('license_keys')
        .insert([{
          key: licenseKey,
          is_used: true,
          assigned_user_id: selectedUser.id
        }])

      if (licenseError) throw licenseError

      // Then update the user with the license key
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          license_key: licenseKey,
          verified: true
        })
        .eq('id', selectedUser.id)

      if (userError) throw userError

      toast.success(`User ${selectedUser.email} berhasil di-approve dengan license key: ${licenseKey}`)
      setShowModal(false)
      setSelectedUser(null)
      setLicenseKey('')
      fetchPendingUsers()
    } catch (error: any) {
      toast.error('Error approving user: ' + error.message)
    } finally {
      setApproving(false)
    }
  }

  const handleRejectUser = async (userId: string, email: string) => {
    if (!confirm(`Yakin ingin menolak user ${email}? User akan dihapus dari sistem.`)) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      
      toast.success(`User ${email} berhasil ditolak dan dihapus`)
      fetchPendingUsers()
    } catch (error: any) {
      toast.error('Error rejecting user: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">User Approval</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Approval</h1>
          <p className="text-gray-600">Kelola persetujuan user baru dan assign license key</p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-gray-600">{pendingUsers.length} pending approval</span>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Pending User Approvals</h3>
              <p className="text-orange-700">User yang menunggu persetujuan admin</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-600">{pendingUsers.length}</p>
              <p className="text-sm text-orange-600">users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Users List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Daftar User Pending</h3>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada user yang menunggu approval.</p>
              <p className="text-sm text-gray-400 mt-2">Semua user baru akan muncul di sini untuk di-approve.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((pendingUser) => (
                <div key={pendingUser.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Mail className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{pendingUser.email}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Mendaftar: {new Date(pendingUser.created_at).toLocaleDateString('id-ID')}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            pendingUser.verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {pendingUser.verified ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Email Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Email Not Verified
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRejectUser(pendingUser.id, pendingUser.email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Tolak
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(pendingUser)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedUser(null)
          setLicenseKey('')
        }}
        title="Approve User"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">User Information</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Tanggal Daftar:</strong> {new Date(selectedUser.created_at).toLocaleDateString('id-ID')}</p>
                <p><strong>Status Email:</strong> {selectedUser.verified ? 'Verified' : 'Not Verified'}</p>
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
              <p className="text-xs text-gray-500">
                License key akan diberikan kepada user untuk mengakses aplikasi
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Konfirmasi Approval</p>
                  <p>User akan dapat mengakses aplikasi setelah di-approve dan license key akan disimpan ke database.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  setSelectedUser(null)
                  setLicenseKey('')
                }}
              >
                Batal
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={!licenseKey.trim() || approving}
                className="bg-green-600 hover:bg-green-700"
              >
                {approving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Approving...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve User
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