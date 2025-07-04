import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { Download, Upload, Database, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export function Backup() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [backupData, setBackupData] = useState<any>(null)

  const exportAllData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [
        classesData,
        studentsData,
        subjectsData,
        categoriesData,
        weightsData,
        scoresData,
        attendanceData
      ] = await Promise.all([
        supabase.from('classes').select('*').eq('user_id', user.id),
        supabase.from('students').select('*').eq('user_id', user.id),
        supabase.from('subjects').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('weights').select('*').eq('user_id', user.id),
        supabase.from('scores').select('*').eq('user_id', user.id),
        supabase.from('attendance').select('*').eq('user_id', user.id)
      ])

      const backup = {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        data: {
          classes: classesData.data || [],
          students: studentsData.data || [],
          subjects: subjectsData.data || [],
          categories: categoriesData.data || [],
          weights: weightsData.data || [],
          scores: scoresData.data || [],
          attendance: attendanceData.data || []
        }
      }

      // Export as JSON
      const jsonBlob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const jsonUrl = URL.createObjectURL(jsonBlob)
      const jsonLink = document.createElement('a')
      jsonLink.href = jsonUrl
      jsonLink.download = `backup-${new Date().toISOString().split('T')[0]}.json`
      jsonLink.click()

      // Export as Excel
      const workbook = XLSX.utils.book_new()
      
      Object.entries(backup.data).forEach(([tableName, tableData]) => {
        if (Array.isArray(tableData) && tableData.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(tableData)
          XLSX.utils.book_append_sheet(workbook, worksheet, tableName)
        }
      })

      XLSX.writeFile(workbook, `backup-${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success('Backup berhasil diunduh!')
    } catch (error: any) {
      toast.error('Error creating backup: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)
        
        if (data.user_id && data.data && data.timestamp) {
          setBackupData(data)
          toast.success('File backup berhasil dibaca!')
        } else {
          toast.error('Format file backup tidak valid')
        }
      } catch (error) {
        toast.error('Error reading backup file')
      }
    }
    reader.readAsText(file)
  }

  const restoreData = async () => {
    if (!user || !backupData) return

    const confirmed = confirm(
      'PERINGATAN: Proses restore akan menghapus semua data yang ada dan menggantinya dengan data dari backup. Apakah Anda yakin?'
    )
    
    if (!confirmed) return

    setLoading(true)
    try {
      // Delete existing data
      await Promise.all([
        supabase.from('attendance').delete().eq('user_id', user.id),
        supabase.from('scores').delete().eq('user_id', user.id),
        supabase.from('weights').delete().eq('user_id', user.id),
        supabase.from('students').delete().eq('user_id', user.id),
        supabase.from('categories').delete().eq('user_id', user.id),
        supabase.from('subjects').delete().eq('user_id', user.id),
        supabase.from('classes').delete().eq('user_id', user.id)
      ])

      // Insert backup data in correct order (respecting foreign keys)
      const { data } = backupData

      if (data.classes?.length > 0) {
        const { error } = await supabase.from('classes').insert(data.classes)
        if (error) throw error
      }

      if (data.subjects?.length > 0) {
        const { error } = await supabase.from('subjects').insert(data.subjects)
        if (error) throw error
      }

      if (data.categories?.length > 0) {
        const { error } = await supabase.from('categories').insert(data.categories)
        if (error) throw error
      }

      if (data.students?.length > 0) {
        const { error } = await supabase.from('students').insert(data.students)
        if (error) throw error
      }

      if (data.weights?.length > 0) {
        const { error } = await supabase.from('weights').insert(data.weights)
        if (error) throw error
      }

      if (data.scores?.length > 0) {
        const { error } = await supabase.from('scores').insert(data.scores)
        if (error) throw error
      }

      if (data.attendance?.length > 0) {
        const { error } = await supabase.from('attendance').insert(data.attendance)
        if (error) throw error
      }

      toast.success('Data berhasil direstore!')
      setBackupData(null)
      
      // Refresh page to show restored data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      toast.error('Error restoring data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearBackupData = () => {
    setBackupData(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
      </div>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Backup Data</h3>
              <p className="text-sm text-gray-600">Unduh semua data Anda sebagai file backup</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Yang akan di-backup:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Data Kelas</li>
                <li>• Data Siswa</li>
                <li>• Data Mata Pelajaran</li>
                <li>• Data Kategori Penilaian</li>
                <li>• Data Bobot Penilaian</li>
                <li>• Data Nilai</li>
                <li>• Data Kehadiran</li>
              </ul>
            </div>
            
            <Button onClick={exportAllData} disabled={loading} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Membuat Backup...' : 'Download Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Restore Data</h3>
              <p className="text-sm text-gray-600">Pulihkan data dari file backup</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Peringatan!</h4>
                  <p className="text-sm text-red-800">
                    Proses restore akan menghapus semua data yang ada saat ini dan menggantinya dengan data dari backup. 
                    Pastikan Anda sudah membuat backup data terbaru sebelum melakukan restore.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih File Backup (JSON)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {backupData && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 mb-2">File Backup Valid</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>Tanggal Backup: {new Date(backupData.timestamp).toLocaleString('id-ID')}</p>
                      <p>User ID: {backupData.user_id}</p>
                      <div className="mt-2">
                        <p className="font-medium">Data yang akan direstore:</p>
                        <ul className="mt-1 space-y-1">
                          {Object.entries(backupData.data).map(([table, data]: [string, any]) => (
                            <li key={table}>• {table}: {Array.isArray(data) ? data.length : 0} records</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button onClick={restoreData} disabled={loading} variant="primary">
                        <Database className="w-4 h-4 mr-2" />
                        {loading ? 'Restoring...' : 'Restore Data'}
                      </Button>
                      <Button onClick={clearBackupData} variant="secondary">
                        Batal
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Petunjuk Penggunaan</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Backup Data:</h4>
              <p>Klik tombol "Download Backup" untuk mengunduh semua data Anda dalam format JSON dan Excel. File ini dapat digunakan untuk restore data di kemudian hari.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Restore Data:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Pilih file backup JSON yang valid</li>
                <li>Sistem akan menampilkan preview data yang akan direstore</li>
                <li>Klik "Restore Data" untuk memulai proses</li>
                <li>Semua data lama akan dihapus dan diganti dengan data dari backup</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">Tips:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Lakukan backup secara berkala untuk menjaga keamanan data</li>
                <li>Simpan file backup di tempat yang aman</li>
                <li>Pastikan file backup tidak rusak sebelum melakukan restore</li>
                <li>Selalu buat backup terbaru sebelum melakukan restore</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}