import { useState } from 'react'
import { Download, Smartphone, Check } from 'lucide-react'
import { usePWA } from '../../hooks/usePWA'
import { Button } from './Button'
import toast from 'react-hot-toast'

export function InstallButton() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [isInstalling, setIsInstalling] = useState(false)

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await installApp()
      if (success) {
        toast.success('Aplikasi berhasil diinstall!')
      } else {
        toast.error('Gagal menginstall aplikasi')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menginstall')
    } finally {
      setIsInstalling(false)
    }
  }

  // Don't show button if not installable or already installed
  if (!isInstallable || isInstalled) {
    return null
  }

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
      size="sm"
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="hidden sm:inline">Installing...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </>
      )}
    </Button>
  )
}

export function InstallPrompt() {
  const { isInstallable, isInstalled } = usePWA()

  // Show install prompt for mobile users
  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Install SUMATIF CLOUD
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Install aplikasi ini untuk akses yang lebih cepat dan pengalaman yang lebih baik.
          </p>
        </div>
      </div>
    </div>
  )
}