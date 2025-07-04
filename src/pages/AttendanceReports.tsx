import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Student, Class, Attendance } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ClipboardList, Download, FileText, Calendar, Filter, Users, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface AttendanceReport {
  student: Student
  totalDays: number
  hadir: number
  sakit: number
  izin: number
  alfa: number
  terlambat: number
  attendancePercentage: number
}

interface AttendanceSummary {
  totalStudents: number
  totalDays: number
  averageAttendance: number
  bestAttendance: AttendanceReport | null
  worstAttendance: AttendanceReport | null
}

export function AttendanceReports() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [reports, setReports] = useState<AttendanceReport[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalStudents: 0,
    totalDays: 0,
    averageAttendance: 0,
    bestAttendance: null,
    worstAttendance: null
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    class_id: '',
    start_date: '',
    end_date: '',
    student_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    if (filters.start_date && filters.end_date) {
      generateReports()
    }
  }, [filters, students, classes])

  const fetchData = async () => {
    if (!user) return

    try {
      const [studentsData, classesData] = await Promise.all([
        supabase.from('students').select('*, class:classes(name)').eq('user_id', user.id),
        supabase.from('classes').select('*').eq('user_id', user.id).eq('is_active', true)
      ])

      if (studentsData.error) throw studentsData.error
      if (classesData.error) throw classesData.error

      setStudents(studentsData.data || [])
      setClasses(classesData.data || [])

      // Set default date range (current month)
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      setFilters(prev => ({
        ...prev,
        start_date: firstDay.toISOString().split('T')[0],
        end_date: lastDay.toISOString().split('T')[0]
      }))
    } catch (error: any) {
      toast.error('Error fetching data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateReports = async () => {
    if (!user || !filters.start_date || !filters.end_date) return

    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', filters.start_date)
        .lte('date', filters.end_date)

      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id)
      }

      const { data: attendanceData, error } = await query

      if (error) throw error

      const filteredStudents = filters.class_id 
        ? students.filter(s => s.class_id === filters.class_id)
        : students

      const finalStudents = filters.student_id
        ? filteredStudents.filter(s => s.id === filters.student_id)
        : filteredStudents

      // Calculate date range
      const startDate = new Date(filters.start_date)
      const endDate = new Date(filters.end_date)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const studentReports: AttendanceReport[] = finalStudents.map(student => {
        const studentAttendance = attendanceData?.filter(a => a.student_id === student.id) || []
        
        const hadir = studentAttendance.filter(a => a.status === 'hadir').length
        const sakit = studentAttendance.filter(a => a.status === 'sakit').length
        const izin = studentAttendance.filter(a => a.status === 'izin').length
        const alfa = studentAttendance.filter(a => a.status === 'alfa').length
        const terlambat = studentAttendance.filter(a => a.status === 'terlambat').length
        
        const attendedDays = hadir + terlambat // Terlambat still counts as attended
        const attendancePercentage = totalDays > 0 ? (attendedDays / totalDays) * 100 : 0

        return {
          student,
          totalDays,
          hadir,
          sakit,
          izin,
          alfa,
          terlambat,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        }
      })

      // Calculate summary
      const averageAttendance = studentReports.length > 0 
        ? studentReports.reduce((sum, report) => sum + report.attendancePercentage, 0) / studentReports.length
        : 0

      const bestAttendance = studentReports.length > 0
        ? studentReports.reduce((best, current) => 
            current.attendancePercentage > best.attendancePercentage ? current : best
          )
        : null

      const worstAttendance = studentReports.length > 0
        ? studentReports.reduce((worst, current) => 
            current.attendancePercentage < worst.attendancePercentage ? current : worst
          )
        : null

      setReports(studentReports)
      setSummary({
        totalStudents: studentReports.length,
        totalDays,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        bestAttendance,
        worstAttendance
      })
    } catch (error: any) {
      toast.error('Error generating reports: ' + error.message)
    }
  }

  const getAttendanceColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-100 text-green-800'
    if (percentage >= 80) return 'bg-blue-100 text-blue-800'
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800'
    if (percentage >= 60) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getAttendanceGrade = (percentage: number): string => {
    if (percentage >= 95) return 'Sangat Baik'
    if (percentage >= 85) return 'Baik'
    if (percentage >= 75) return 'Cukup'
    if (percentage >= 65) return 'Kurang'
    return 'Sangat Kurang'
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(16)
    doc.text('REKAP KEHADIRAN SISWA', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Periode: ${new Date(filters.start_date).toLocaleDateString('id-ID')} - ${new Date(filters.end_date).toLocaleDateString('id-ID')}`, 20, 30)
    doc.text(`Total Hari: ${summary.totalDays} hari`, 20, 40)
    doc.text(`Rata-rata Kehadiran: ${summary.averageAttendance.toFixed(1)}%`, 20, 50)

    // Table data
    const tableData = reports.map(report => [
      report.student.name,
      report.student.nis,
      report.student.class?.name || '-',
      report.hadir.toString(),
      report.sakit.toString(),
      report.izin.toString(),
      report.alfa.toString(),
      report.terlambat.toString(),
      `${report.attendancePercentage.toFixed(1)}%`,
      getAttendanceGrade(report.attendancePercentage)
    ])

    const headers = [
      'Nama', 'NIS', 'Kelas', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Terlambat', 'Persentase', 'Predikat'
    ]

    ;(doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        8: { halign: 'center' },
        9: { halign: 'center' }
      }
    })

    doc.save(`rekap-kehadiran-${filters.start_date}-${filters.end_date}.pdf`)
  }

  const exportToExcel = () => {
    const exportData = reports.map(report => ({
      'Nama': report.student.name,
      'NIS': report.student.nis,
      'Kelas': report.student.class?.name || '-',
      'Total Hari': report.totalDays,
      'Hadir': report.hadir,
      'Sakit': report.sakit,
      'Izin': report.izin,
      'Alfa': report.alfa,
      'Terlambat': report.terlambat,
      'Persentase Kehadiran': `${report.attendancePercentage.toFixed(1)}%`,
      'Predikat': getAttendanceGrade(report.attendancePercentage)
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kehadiran')
    XLSX.writeFile(workbook, `rekap-kehadiran-${filters.start_date}-${filters.end_date}.xlsx`)
  }

  const clearFilters = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setFilters({
      class_id: '',
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
      student_id: ''
    })
  }

  const classOptions = classes.map(cls => ({
    value: cls.id,
    label: cls.name
  }))

  const studentOptions = students
    .filter(student => !filters.class_id || student.class_id === filters.class_id)
    .map(student => ({
      value: student.id,
      label: `${student.name} (${student.nis})`
    }))

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Rekap Kehadiran</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rekap Kehadiran</h1>
        {reports.length > 0 && (
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="secondary" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filter Laporan</h3>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              required
            />
            <Select
              label="Kelas (Opsional)"
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value, student_id: '' })}
              options={classOptions}
            />
            <Select
              label="Siswa (Opsional)"
              value={filters.student_id}
              onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
              options={studentOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hari</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalDays}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rata-rata Kehadiran</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.averageAttendance.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kehadiran Terbaik</p>
                  <p className="text-lg font-bold text-gray-900">
                    {summary.bestAttendance?.attendancePercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.bestAttendance?.student.name}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <ClipboardList className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Table */}
      {filters.start_date && filters.end_date && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Rekap Kehadiran - {new Date(filters.start_date).toLocaleDateString('id-ID')} s/d {new Date(filters.end_date).toLocaleDateString('id-ID')}
              </h3>
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">{reports.length} siswa</span>
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
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Hadir</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Sakit</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Izin</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Alfa</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Terlambat</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Persentase</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{report.student.name}</td>
                      <td className="py-3 px-4 text-gray-600">{report.student.nis}</td>
                      <td className="py-3 px-4 text-gray-600">{report.student.class?.name || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {report.hadir}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {report.sakit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {report.izin}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          {report.alfa}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          {report.terlambat}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getAttendanceColor(report.attendancePercentage)}`}>
                          {report.attendancePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {getAttendanceGrade(report.attendancePercentage)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && filters.start_date && filters.end_date && (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada data kehadiran untuk periode ini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!filters.start_date || !filters.end_date && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Pilih periode tanggal untuk melihat rekap kehadiran.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}