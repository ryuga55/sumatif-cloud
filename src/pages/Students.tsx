import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Student, Class } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit, Trash2, Users, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export function Students() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    class_id: ''
  })

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [user])

  const fetchStudents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (error: any) {
      toast.error('Error fetching students: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setClasses(data || [])
    } catch (error: any) {
      toast.error('Error fetching classes: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', editingStudent.id)

        if (error) throw error
        toast.success('Siswa berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('students')
          .insert([{
            ...formData,
            user_id: user.id
          }])

        if (error) throw error
        toast.success('Siswa berhasil ditambahkan!')
      }

      setShowModal(false)
      setEditingStudent(null)
      setFormData({ name: '', nis: '', class_id: '' })
      fetchStudents()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      nis: student.nis,
      class_id: student.class_id
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Siswa berhasil dihapus!')
      fetchStudents()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        importStudents(jsonData)
      } catch (error) {
        toast.error('Error reading file')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const importStudents = async (data: any[]) => {
    if (!user) return

    try {
      const studentsToImport = data.map((row: any) => ({
        name: row.nama || row.name,
        nis: row.nis || row.NIS,
        class_id: formData.class_id,
        user_id: user.id
      })).filter(student => student.name && student.nis)

      if (studentsToImport.length === 0) {
        toast.error('Tidak ada data siswa yang valid untuk diimport')
        return
      }

      const { error } = await supabase
        .from('students')
        .insert(studentsToImport)

      if (error) throw error
      
      toast.success(`${studentsToImport.length} siswa berhasil diimport!`)
      setShowImportModal(false)
      fetchStudents()
    } catch (error: any) {
      toast.error('Error importing students: ' + error.message)
    }
  }

  const exportToExcel = () => {
    const exportData = students.map(student => ({
      'Nama': student.name,
      'NIS': student.nis,
      'Kelas': student.class?.name || '',
      'Tanggal Dibuat': new Date(student.created_at).toLocaleDateString('id-ID')
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa')
    XLSX.writeFile(workbook, 'data-siswa.xlsx')
  }

  const classOptions = classes.map(cls => ({
    value: cls.id,
    label: cls.name
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Siswa</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Siswa</h1>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={exportToExcel}>
            <Upload className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Siswa</h3>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">{students.length} siswa</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">NIS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Kelas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tanggal Dibuat</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                    <td className="py-3 px-4 text-gray-600">{student.nis}</td>
                    <td className="py-3 px-4 text-gray-600">{student.class?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(student.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada siswa yang terdaftar.</p>
              <Button onClick={() => setShowModal(true)} className="mt-4">
                Tambah Siswa Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingStudent(null)
          setFormData({ name: '', nis: '', class_id: '' })
        }}
        title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Siswa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="NIS"
            value={formData.nis}
            onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
            required
          />

          <Select
            label="Kelas"
            value={formData.class_id}
            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            options={classOptions}
            required
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingStudent(null)
                setFormData({ name: '', nis: '', class_id: '' })
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              {editingStudent ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Siswa dari Excel"
      >
        <div className="space-y-4">
          <Select
            label="Pilih Kelas untuk Import"
            value={formData.class_id}
            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            options={classOptions}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: kolom 'nama' dan 'nis' harus ada
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowImportModal(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}