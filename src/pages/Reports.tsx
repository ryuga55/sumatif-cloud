import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Student, Subject, Category, Weight, Score } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, Download, FileText, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface StudentReport {
  student: Student
  subject: Subject
  scores: { [categoryId: string]: number }
  finalScore: number
  grade: string
}

export function Reports() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [weights, setWeights] = useState<Weight[]>([])
  const [reports, setReports] = useState<StudentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    subject_id: '',
    class_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    if (filters.subject_id) {
      generateReports()
    }
  }, [filters, students, subjects, categories, weights])

  const fetchData = async () => {
    if (!user) return

    try {
      const [studentsData, subjectsData, categoriesData, weightsData] = await Promise.all([
        supabase.from('students').select('*, class:classes(name)').eq('user_id', user.id),
        supabase.from('subjects').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('weights').select('*, category:categories(name)').eq('user_id', user.id)
      ])

      if (studentsData.error) throw studentsData.error
      if (subjectsData.error) throw subjectsData.error
      if (categoriesData.error) throw categoriesData.error
      if (weightsData.error) throw weightsData.error

      setStudents(studentsData.data || [])
      setSubjects(subjectsData.data || [])
      setCategories(categoriesData.data || [])
      setWeights(weightsData.data || [])
    } catch (error: any) {
      toast.error('Error fetching data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateReports = async () => {
    if (!user || !filters.subject_id) return

    try {
      const { data: scores, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject_id', filters.subject_id)

      if (error) throw error

      const subject = subjects.find(s => s.id === filters.subject_id)
      if (!subject) return

      const filteredStudents = filters.class_id 
        ? students.filter(s => s.class_id === filters.class_id)
        : students

      const studentReports: StudentReport[] = filteredStudents.map(student => {
        const studentScores = scores?.filter(s => s.student_id === student.id) || []
        
        // Calculate average score for each category
        const categoryScores: { [categoryId: string]: number } = {}
        categories.forEach(category => {
          const categoryScoresList = studentScores.filter(s => s.category_id === category.id)
          if (categoryScoresList.length > 0) {
            const average = categoryScoresList.reduce((sum, s) => sum + s.score, 0) / categoryScoresList.length
            categoryScores[category.id] = average
          }
        })

        // Calculate final score using weights
        let finalScore = 0
        let totalWeight = 0
        
        weights.forEach(weight => {
          if (categoryScores[weight.category_id] !== undefined) {
            finalScore += categoryScores[weight.category_id] * (weight.weight_percent / 100)
            totalWeight += weight.weight_percent
          }
        })

        // Normalize if total weight is not 100%
        if (totalWeight > 0 && totalWeight !== 100) {
          finalScore = (finalScore * 100) / totalWeight
        }

        const grade = getGrade(finalScore)

        return {
          student,
          subject,
          scores: categoryScores,
          finalScore: Math.round(finalScore * 100) / 100,
          grade
        }
      })

      setReports(studentReports)
    } catch (error: any) {
      toast.error('Error generating reports: ' + error.message)
    }
  }

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'E'
  }

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800'
      case 'B': return 'bg-blue-100 text-blue-800'
      case 'C': return 'bg-yellow-100 text-yellow-800'
      case 'D': return 'bg-orange-100 text-orange-800'
      case 'E': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const subject = subjects.find(s => s.id === filters.subject_id)
    
    doc.setFontSize(16)
    doc.text(`Rekap Nilai - ${subject?.name || 'Semua Mata Pelajaran'}`, 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 30)

    const tableData = reports.map(report => [
      report.student.name,
      report.student.nis,
      report.student.class?.name || '-',
      ...categories.map(cat => report.scores[cat.id]?.toFixed(1) || '-'),
      report.finalScore.toFixed(1),
      report.grade
    ])

    const headers = [
      'Nama',
      'NIS', 
      'Kelas',
      ...categories.map(cat => cat.name),
      'Nilai Akhir',
      'Grade'
    ]

    ;(doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    doc.save(`rekap-nilai-${subject?.name || 'semua'}.pdf`)
  }

  const exportToExcel = () => {
    const subject = subjects.find(s => s.id === filters.subject_id)
    
    const exportData = reports.map(report => {
      const row: any = {
        'Nama': report.student.name,
        'NIS': report.student.nis,
        'Kelas': report.student.class?.name || '-'
      }
      
      categories.forEach(cat => {
        row[cat.name] = report.scores[cat.id]?.toFixed(1) || '-'
      })
      
      row['Nilai Akhir'] = report.finalScore.toFixed(1)
      row['Grade'] = report.grade
      
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai')
    XLSX.writeFile(workbook, `rekap-nilai-${subject?.name || 'semua'}.xlsx`)
  }

  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: subject.name
  }))

  const classOptions = Array.from(new Set(students.map(s => s.class_id)))
    .map(classId => {
      const student = students.find(s => s.class_id === classId)
      return {
        value: classId,
        label: student?.class?.name || 'Unknown'
      }
    })

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Rekap Nilai</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rekap Nilai</h1>
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
          <h3 className="text-lg font-semibold text-gray-900">Filter Laporan</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Mata Pelajaran"
              value={filters.subject_id}
              onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })}
              options={subjectOptions}
              required
            />
            <Select
              label="Kelas (Opsional)"
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
              options={classOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weight Summary */}
      {weights.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Bobot Penilaian</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {weights.map(weight => (
                <div key={weight.id} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{weight.category?.name}</p>
                  <p className="text-2xl font-bold text-blue-600">{weight.weight_percent}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Table */}
      {filters.subject_id && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Rekap Nilai - {subjects.find(s => s.id === filters.subject_id)?.name}
              </h3>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-gray-500" />
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
                    {categories.map(category => (
                      <th key={category.id} className="text-left py-3 px-4 font-medium text-gray-900">
                        {category.name}
                      </th>
                    ))}
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Nilai Akhir</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{report.student.name}</td>
                      <td className="py-3 px-4 text-gray-600">{report.student.nis}</td>
                      <td className="py-3 px-4 text-gray-600">{report.student.class?.name || '-'}</td>
                      {categories.map(category => (
                        <td key={category.id} className="py-3 px-4 text-gray-600">
                          {report.scores[category.id]?.toFixed(1) || '-'}
                        </td>
                      ))}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          {report.finalScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getGradeColor(report.grade)}`}>
                          {report.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && filters.subject_id && (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada data nilai untuk mata pelajaran ini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!filters.subject_id && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Pilih mata pelajaran untuk melihat rekap nilai.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}