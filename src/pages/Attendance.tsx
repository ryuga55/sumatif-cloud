import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Attendance, Student } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit, Trash2, Calendar, Filter, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export function AttendancePage() {
  const { user } = useAuth()
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [filters, setFilters] = useState({
    student_id: '',
    date: '',
    status: ''
  })
  const [formData, setFormData] = useState({
    student_id: '',
    date: '',
    status: ''
  })
  const [bulkData, setBulkData] = useState({
    date: '',
    attendances: [] as { student_id: string; status: string }[]
  })

  const statusOptions = [
    { value: 'hadir', label: 'Hadir' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'izin', label: 'Izin' },
    { value: 'alfa', label: 'Alfa' },
    { value: 'terlambat', label: 'Terlambat' }
  ]

  useEffect(() => {
    fetchAttendances()
    fetchStudents()
  }, [user])

  useEffect(() => {
    fetchAttendances()
  }, [filters])

  const fetchAttendances = async () => {
    if (!user) return

    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          student:students(name, nis)
        `)
        .eq('user_id', user.id)

      if (filters.student_id) query = query.eq('student_id', filters.student_id)
      if (filters.date) query = query.eq('date', filters.date)
      if (filters.status) query = query.eq('status', filters.status)

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error
      setAttendances(data || [])
    } catch (error: any) {
      toast.error('Error fetching attendance: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setStudents(data || [])
      
      // Initialize bulk attendance data
      setBulkData({
        date: new Date().toISOString().split('T')[0],
        attendances: data?.map(student => ({
          student_id: student.id,
          status: 'hadir'
        })) || []
      })
    } catch (error: any) {
      toast.error('Error fetching students: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingAttendance) {
        const { error } = await supabase
          .from('attendance')
          .update({
            student_id: formData.student_id,
            date: formData.date,
            status: formData.status
          })
          .eq('id', editingAttendance.id)

        if (error) throw error
        toast.success('Kehadiran berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert([{
            student_id: formData.student_id,
            date: formData.date,
            status: formData.status,
            user_id: user.id
          }])

        if (error) throw error
        toast.success('Kehadiran berhasil ditambahkan!')
      }

      setShowModal(false)
      setEditingAttendance(null)
      setFormData({ student_id: '', date: '', status: '' })
      fetchAttendances()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const attendanceData = bulkData.attendances.map(att => ({
        student_id: att.student_id,
        date: bulkData.date,
        status: att.status,
        user_id: user.id
      }))

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceData, {
          onConflict: 'user_id,student_id,date'
        })

      if (error) throw error
      toast.success('Kehadiran massal berhasil disimpan!')
      setShowBulkModal(false)
      fetchAttendances()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance)
    setFormData({
      student_id: attendance.student_id,
      date: attendance.date,
      status: attendance.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data kehadiran ini?')) return

    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Data kehadiran berhasil dihapus!')
      fetchAttendances()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const clearFilters = () => {
    setFilters({ student_id: '', date: '', status: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return 'bg-green-100 text-green-800'
      case 'sakit': return 'bg-blue-100 text-blue-800'
      case 'izin': return 'bg-yellow-100 text-yellow-800'
      case 'terlambat': return 'bg-orange-100 text-orange-800'
      case 'alfa': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? option.label : status
  }

  const updateBulkAttendance = (studentId: string, status: string) => {
    setBulkData(prev => ({
      ...prev,
      attendances: prev.attendances.map(att =>
        att.student_id === studentId ? { ...att, status } : att
      )
    }))
  }

  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.name} (${student.nis})`
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Input Kehadiran</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Input Kehadiran</h1>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setShowBulkModal(true)}>
            <Users className="w-4 h-4 mr-2" />
            Input Massal
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kehadiran
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filter Kehadiran</h3>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Siswa"
              value={filters.student_id}
              onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
              options={studentOptions}
            />
            <Input
              label="Tanggal"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={statusOptions}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Data Kehadiran</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Siswa</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">NIS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance) => (
                  <tr key={attendance.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {attendance.student?.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {attendance.student?.nis}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(attendance.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.status)}`}>
                        {getStatusLabel(attendance.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(attendance)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(attendance.id)}
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

          {attendances.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {Object.values(filters).some(f => f) ? 'Tidak ada data kehadiran yang sesuai dengan filter.' : 'Belum ada data kehadiran.'}
              </p>
              <Button onClick={() => setShowModal(true)} className="mt-4">
                Tambah Data Kehadiran Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Attendance Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingAttendance(null)
          setFormData({ student_id: '', date: '', status: '' })
        }}
        title={editingAttendance ? 'Edit Kehadiran' : 'Tambah Kehadiran'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Siswa"
            value={formData.student_id}
            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            options={studentOptions}
            required
          />

          <Input
            label="Tanggal"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Select
            label="Status Kehadiran"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
            required
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingAttendance(null)
                setFormData({ student_id: '', date: '', status: '' })
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              {editingAttendance ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Attendance Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Input Kehadiran Massal"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <Input
            label="Tanggal"
            type="date"
            value={bulkData.date}
            onChange={(e) => setBulkData({ ...bulkData, date: e.target.value })}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Status Kehadiran Siswa
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {students.map((student) => {
                const attendance = bulkData.attendances.find(att => att.student_id === student.id)
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.nis}</p>
                    </div>
                    <select
                      value={attendance?.status || 'hadir'}
                      onChange={(e) => updateBulkAttendance(student.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowBulkModal(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan Semua
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}