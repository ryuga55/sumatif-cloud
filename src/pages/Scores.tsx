import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Score, Student, Subject, Category } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit, Trash2, FileText, Filter, Save, SaveAll, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScoreRow {
  student: Student
  score: string
  isModified: boolean
  isSaving: boolean
}

export function Scores() {
  const { user } = useAuth()
  const [scores, setScores] = useState<Score[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSpreadsheet, setShowSpreadsheet] = useState(false)
  const [editingScore, setEditingScore] = useState<Score | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  
  // Filters for both views
  const [filters, setFilters] = useState({
    student_id: '',
    subject_id: '',
    category_id: ''
  })
  
  // Form data for single entry modal
  const [formData, setFormData] = useState({
    student_id: '',
    subject_id: '',
    category_id: '',
    assessment_name: '',
    score: ''
  })

  // Spreadsheet data
  const [spreadsheetData, setSpreadsheetData] = useState({
    subject_id: '',
    category_id: '',
    assessment_name: '',
    rows: [] as ScoreRow[]
  })

  useEffect(() => {
    fetchScores()
    fetchStudents()
    fetchSubjects()
    fetchCategories()
  }, [user])

  useEffect(() => {
    fetchScores()
  }, [filters])

  useEffect(() => {
    if (spreadsheetData.subject_id && spreadsheetData.category_id && spreadsheetData.assessment_name) {
      initializeSpreadsheetRows()
    }
  }, [spreadsheetData.subject_id, spreadsheetData.category_id, spreadsheetData.assessment_name, students])

  const fetchScores = async () => {
    if (!user) return

    try {
      let query = supabase
        .from('scores')
        .select(`
          *,
          student:students(name, nis),
          subject:subjects(name),
          category:categories(name)
        `)
        .eq('user_id', user.id)

      if (filters.student_id) query = query.eq('student_id', filters.student_id)
      if (filters.subject_id) query = query.eq('subject_id', filters.subject_id)
      if (filters.category_id) query = query.eq('category_id', filters.category_id)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setScores(data || [])
    } catch (error: any) {
      toast.error('Error fetching scores: ' + error.message)
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
    } catch (error: any) {
      toast.error('Error fetching students: ' + error.message)
    }
  }

  const fetchSubjects = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (error: any) {
      toast.error('Error fetching subjects: ' + error.message)
    }
  }

  const fetchCategories = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      toast.error('Error fetching categories: ' + error.message)
    }
  }

  const initializeSpreadsheetRows = async () => {
    if (!user || !spreadsheetData.subject_id || !spreadsheetData.category_id || !spreadsheetData.assessment_name) return

    try {
      // Get existing scores for this subject, category, and assessment
      const { data: existingScores, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject_id', spreadsheetData.subject_id)
        .eq('category_id', spreadsheetData.category_id)
        .eq('assessment_name', spreadsheetData.assessment_name)

      if (error) throw error

      const rows: ScoreRow[] = students.map(student => {
        const existingScore = existingScores?.find(s => s.student_id === student.id)
        return {
          student,
          score: existingScore ? existingScore.score.toString() : '',
          isModified: false,
          isSaving: false
        }
      })

      setSpreadsheetData(prev => ({ ...prev, rows }))
    } catch (error: any) {
      toast.error('Error initializing spreadsheet: ' + error.message)
    }
  }

  const handleSpreadsheetScoreChange = (studentId: string, value: string) => {
    setSpreadsheetData(prev => ({
      ...prev,
      rows: prev.rows.map(row => 
        row.student.id === studentId 
          ? { ...row, score: value, isModified: true }
          : row
      )
    }))
  }

  // Handle category change in spreadsheet mode - auto clear assessment name
  const handleSpreadsheetCategoryChange = (categoryId: string) => {
    setSpreadsheetData(prev => ({
      ...prev,
      category_id: categoryId,
      assessment_name: '', // Auto clear assessment name
      rows: [] // Clear rows to reset the spreadsheet
    }))
  }

  const saveIndividualScore = async (studentId: string) => {
    if (!user) return

    const row = spreadsheetData.rows.find(r => r.student.id === studentId)
    if (!row || !row.score) return

    const scoreValue = parseFloat(row.score)
    if (scoreValue < 0 || scoreValue > 100) {
      toast.error('Nilai harus antara 0-100')
      return
    }

    if (!spreadsheetData.assessment_name.trim()) {
      toast.error('Nama penilaian harus diisi')
      return
    }

    // Set saving state
    setSpreadsheetData(prev => ({
      ...prev,
      rows: prev.rows.map(r => 
        r.student.id === studentId 
          ? { ...r, isSaving: true }
          : r
      )
    }))

    try {
      const { error } = await supabase
        .from('scores')
        .upsert([{
          student_id: studentId,
          subject_id: spreadsheetData.subject_id,
          category_id: spreadsheetData.category_id,
          assessment_name: spreadsheetData.assessment_name,
          score: scoreValue,
          user_id: user.id
        }], {
          onConflict: 'user_id,student_id,subject_id,category_id,assessment_name'
        })

      if (error) throw error

      // Update row state
      setSpreadsheetData(prev => ({
        ...prev,
        rows: prev.rows.map(r => 
          r.student.id === studentId 
            ? { ...r, isModified: false, isSaving: false }
            : r
        )
      }))

      toast.success(`Nilai ${row.student.name} berhasil disimpan!`)
      
      // Refresh the scores list to show updated data
      fetchScores()
    } catch (error: any) {
      toast.error('Error saving score: ' + error.message)
      // Reset saving state
      setSpreadsheetData(prev => ({
        ...prev,
        rows: prev.rows.map(r => 
          r.student.id === studentId 
            ? { ...r, isSaving: false }
            : r
        )
      }))
    }
  }

  const saveAllScores = async () => {
    if (!user) return

    if (!spreadsheetData.assessment_name.trim()) {
      toast.error('Nama penilaian harus diisi')
      return
    }

    const modifiedRows = spreadsheetData.rows.filter(row => row.isModified && row.score)
    if (modifiedRows.length === 0) {
      toast.error('Tidak ada nilai yang diubah')
      return
    }

    setSavingAll(true)

    try {
      const scoresToSave = modifiedRows.map(row => ({
        student_id: row.student.id,
        subject_id: spreadsheetData.subject_id,
        category_id: spreadsheetData.category_id,
        assessment_name: spreadsheetData.assessment_name,
        score: parseFloat(row.score),
        user_id: user.id
      }))

      const { error } = await supabase
        .from('scores')
        .upsert(scoresToSave, {
          onConflict: 'user_id,student_id,subject_id,category_id,assessment_name'
        })

      if (error) throw error

      // Update all modified rows to not modified
      setSpreadsheetData(prev => ({
        ...prev,
        rows: prev.rows.map(row => ({
          ...row,
          isModified: false
        }))
      }))

      toast.success(`${modifiedRows.length} nilai berhasil disimpan!`)
      
      // Refresh the scores list to show updated data
      fetchScores()
    } catch (error: any) {
      toast.error('Error saving scores: ' + error.message)
    } finally {
      setSavingAll(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const scoreValue = parseFloat(formData.score)
    if (scoreValue < 0 || scoreValue > 100) {
      toast.error('Nilai harus antara 0-100')
      return
    }

    try {
      if (editingScore) {
        const { error } = await supabase
          .from('scores')
          .update({
            student_id: formData.student_id,
            subject_id: formData.subject_id,
            category_id: formData.category_id,
            assessment_name: formData.assessment_name,
            score: scoreValue
          })
          .eq('id', editingScore.id)

        if (error) throw error
        toast.success('Nilai berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('scores')
          .insert([{
            student_id: formData.student_id,
            subject_id: formData.subject_id,
            category_id: formData.category_id,
            assessment_name: formData.assessment_name,
            score: scoreValue,
            user_id: user.id
          }])

        if (error) throw error
        toast.success('Nilai berhasil ditambahkan!')
      }

      setShowModal(false)
      setEditingScore(null)
      setFormData({ student_id: '', subject_id: '', category_id: '', assessment_name: '', score: '' })
      fetchScores()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleEdit = (score: Score) => {
    setEditingScore(score)
    setFormData({
      student_id: score.student_id,
      subject_id: score.subject_id,
      category_id: score.category_id,
      assessment_name: score.assessment_name,
      score: score.score.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus nilai ini?')) return

    try {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Nilai berhasil dihapus!')
      fetchScores()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const clearFilters = () => {
    setFilters({ student_id: '', subject_id: '', category_id: '' })
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800'
    if (score >= 70) return 'bg-blue-100 text-blue-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.name} (${student.nis})`
  }))

  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: subject.name
  }))

  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }))

  const modifiedCount = spreadsheetData.rows.filter(row => row.isModified).length

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Input Nilai</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Input Nilai</h1>
        <div className="flex space-x-2">
          <Button 
            variant={showSpreadsheet ? "primary" : "secondary"}
            onClick={() => setShowSpreadsheet(!showSpreadsheet)}
          >
            <Users className="w-4 h-4 mr-2" />
            {showSpreadsheet ? 'Mode Tabel' : 'Mode Spreadsheet'}
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Nilai
          </Button>
        </div>
      </div>

      {/* Spreadsheet View */}
      {showSpreadsheet && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Input Nilai Spreadsheet</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Select
                  label="Mata Pelajaran"
                  value={spreadsheetData.subject_id}
                  onChange={(e) => setSpreadsheetData({ ...spreadsheetData, subject_id: e.target.value })}
                  options={subjectOptions}
                  required
                />
                <Select
                  label="Kategori Penilaian"
                  value={spreadsheetData.category_id}
                  onChange={(e) => handleSpreadsheetCategoryChange(e.target.value)}
                  options={categoryOptions}
                  required
                />
                <Input
                  label="Nama Penilaian"
                  value={spreadsheetData.assessment_name}
                  onChange={(e) => setSpreadsheetData({ ...spreadsheetData, assessment_name: e.target.value })}
                  placeholder="Contoh: UH1 Bab 1"
                  required
                />
              </div>

              {spreadsheetData.subject_id && spreadsheetData.category_id && spreadsheetData.assessment_name && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h4 className="font-medium text-gray-900">
                        {subjects.find(s => s.id === spreadsheetData.subject_id)?.name} - 
                        {categories.find(c => c.id === spreadsheetData.category_id)?.name}
                      </h4>
                      {modifiedCount > 0 && (
                        <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          {modifiedCount} nilai diubah
                        </span>
                      )}
                    </div>
                    <Button 
                      onClick={saveAllScores} 
                      disabled={modifiedCount === 0 || savingAll}
                      className="flex items-center space-x-2"
                    >
                      <SaveAll className="w-4 h-4" />
                      <span>{savingAll ? 'Menyimpan...' : `Simpan Semua (${modifiedCount})`}</span>
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-16">No</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Nama Siswa</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">NIS</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">Nilai</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spreadsheetData.rows.map((row, index) => (
                          <tr 
                            key={row.student.id} 
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              row.isModified ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                            <td className="py-3 px-4 font-medium text-gray-900">{row.student.name}</td>
                            <td className="py-3 px-4 text-gray-600">{row.student.nis}</td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={row.score}
                                onChange={(e) => handleSpreadsheetScoreChange(row.student.id, e.target.value)}
                                className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  row.isModified ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                                }`}
                                placeholder="0-100"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                size="sm"
                                onClick={() => saveIndividualScore(row.student.id)}
                                disabled={!row.score || row.isSaving}
                                className="flex items-center space-x-1"
                              >
                                <Save className="w-3 h-3" />
                                <span className="hidden sm:inline">
                                  {row.isSaving ? 'Saving...' : 'Simpan'}
                                </span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {spreadsheetData.rows.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada siswa yang terdaftar.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regular Table View */}
      {!showSpreadsheet && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filter Nilai</h3>
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
                <Select
                  label="Mata Pelajaran"
                  value={filters.subject_id}
                  onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })}
                  options={subjectOptions}
                />
                <Select
                  label="Kategori"
                  value={filters.category_id}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                  options={categoryOptions}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Daftar Nilai</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Siswa</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Mata Pelajaran</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Kategori</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Penilaian</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Nilai</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tanggal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((score) => (
                      <tr key={score.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{score.student?.name}</p>
                            <p className="text-sm text-gray-600">{score.student?.nis}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{score.subject?.name}</td>
                        <td className="py-3 px-4 text-gray-600">{score.category?.name}</td>
                        <td className="py-3 px-4 text-gray-600">{score.assessment_name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(score.score)}`}>
                            {score.score}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(score.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(score)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(score.id)}
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

              {scores.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {Object.values(filters).some(f => f) ? 'Tidak ada nilai yang sesuai dengan filter.' : 'Belum ada nilai yang diinput.'}
                  </p>
                  <Button onClick={() => setShowModal(true)} className="mt-4">
                    Tambah Nilai Pertama
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Single Entry Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingScore(null)
          setFormData({ student_id: '', subject_id: '', category_id: '', assessment_name: '', score: '' })
        }}
        title={editingScore ? 'Edit Nilai' : 'Tambah Nilai'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Siswa"
            value={formData.student_id}
            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            options={studentOptions}
            required
          />

          <Select
            label="Mata Pelajaran"
            value={formData.subject_id}
            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
            options={subjectOptions}
            required
          />

          <Select
            label="Kategori Penilaian"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            options={categoryOptions}
            required
          />

          <Input
            label="Nama Penilaian"
            value={formData.assessment_name}
            onChange={(e) => setFormData({ ...formData, assessment_name: e.target.value })}
            placeholder="Contoh: UH1 Bab 1, Tugas Harian"
            required
          />

          <Input
            label="Nilai"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.score}
            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
            placeholder="Masukkan nilai 0-100"
            required
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingScore(null)
                setFormData({ student_id: '', subject_id: '', category_id: '', assessment_name: '', score: '' })
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              {editingScore ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}