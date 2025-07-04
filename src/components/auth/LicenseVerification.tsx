import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader } from '../ui/Card'
import toast from 'react-hot-toast'

interface LicenseVerificationProps {
  userId: string
  onSuccess: () => void
}

export function LicenseVerification({ userId, onSuccess }: LicenseVerificationProps) {
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if license key exists and is not used
      const { data: licenses, error: licenseError } = await supabase
        .from('license_keys')
        .select('*')
        .eq('key', licenseKey)
        .eq('is_used', false)
        .limit(1)

      if (licenseError) {
        throw new Error('Terjadi kesalahan saat memverifikasi license key')
      }

      if (!licenses || licenses.length === 0) {
        throw new Error('License key tidak valid atau sudah digunakan')
      }

      const license = licenses[0]

      // Update license key as used
      const { error: updateLicenseError } = await supabase
        .from('license_keys')
        .update({ 
          is_used: true, 
          assigned_user_id: userId 
        })
        .eq('id', license.id)

      if (updateLicenseError) throw updateLicenseError

      // Update user with license key
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ 
          license_key: licenseKey,
          role: 'user'
        })
        .eq('id', userId)

      if (updateUserError) throw updateUserError

      toast.success('License key berhasil diverifikasi!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

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

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Verifikasi License Key
              </h2>
              <p className="text-slate-600 mt-2">
                Masukkan license key untuk mengakses aplikasi
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  type="text"
                  label="License Key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="Masukkan license key 6 karakter"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 text-center font-mono text-lg tracking-widest"
                />
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memverifikasi...</span>
                    </div>
                  ) : (
                    'Verifikasi License Key'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} • Created with ☕ by Rudy Susanto
        </p>
      </footer>
    </div>
  )
}