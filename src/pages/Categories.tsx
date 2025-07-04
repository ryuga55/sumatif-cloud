import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Category } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit, Trash2, Tags } from 'lucide-react'
import toast from 'react-hot-toast'

export function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [user])

  const fetchCategories = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      toast.error('Error fetching categories: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Kategori penilaian berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            ...formData,
            user_id: user.id
          }])

        if (error) throw error
        toast.success('Kategori penilaian berhasil ditambahkan!')
      }

      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '' })
      fetchCategories()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori penilaian ini?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Kategori penilaian berhasil dihapus!')
      fetchCategories()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const predefinedCategories = [
    { name: 'Ulangan Harian 1', description: 'Ulangan harian pertama' },
    { name: 'Ulangan Harian 2', description: 'Ulangan harian kedua' },
    { name: 'UTS', description: 'Ujian Tengah Semester' },
    { name: 'UAS', description: 'Ujian Akhir Semester' },
    { name: 'Tugas', description: 'Tugas harian dan proyek' },
    { name: 'Praktikum', description: 'Nilai praktikum dan laboratorium' }
  ]

  const addPredefinedCategory = async (category: { name: string; description: string }) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          ...category,
          user_id: user.id
        }])

      if (error) throw error
      toast.success(`Kategori ${category.name} berhasil ditambahkan!`)
      fetchCategories()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Kategori Penilaian</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kategori Penilaian</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {categories.length === 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Kategori Penilaian Umum</h3>
            <p className="text-sm text-gray-600">Tambahkan kategori penilaian yang sering digunakan</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedCategories.map((category, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addPredefinedCategory(category)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Tags className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Dibuat: {new Date(category.created_at).toLocaleDateString('id-ID')}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Tags className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada kategori penilaian yang dibuat.</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">
              Tambah Kategori Pertama
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingCategory(null)
          setFormData({ name: '', description: '' })
        }}
        title={editingCategory ? 'Edit Kategori Penilaian' : 'Tambah Kategori Penilaian'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Kategori"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: UH1, UTS, UAS"
            required
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi kategori penilaian"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingCategory(null)
                setFormData({ name: '', description: '' })
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              {editingCategory ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}