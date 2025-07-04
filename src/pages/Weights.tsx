import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Weight, Category } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit, Trash2, Scale, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export function Weights() {
  const { user } = useAuth()
  const [weights, setWeights] = useState<Weight[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWeight, setEditingWeight] = useState<Weight | null>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    weight_percent: ''
  })

  useEffect(() => {
    fetchWeights()
    fetchCategories()
  }, [user])

  const fetchWeights = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('weights')
        .select(`
          *,
          category:categories(name, description)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWeights(data || [])
    } catch (error: any) {
      toast.error('Error fetching weights: ' + error.message)
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const weightPercent = parseInt(formData.weight_percent)
    if (weightPercent < 0 || weightPercent > 100) {
      toast.error('Bobot harus antara 0-100%')
      return
    }

    try {
      if (editingWeight) {
        const { error } = await supabase
          .from('weights')
          .update({
            category_id: formData.category_id,
            weight_percent: weightPercent
          })
          .eq('id', editingWeight.id)

        if (error) throw error
        toast.success('Bobot penilaian berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('weights')
          .insert([{
            category_id: formData.category_id,
            weight_percent: weightPercent,
            user_id: user.id
          }])

        if (error) throw error
        toast.success('Bobot penilaian berhasil ditambahkan!')
      }

      setShowModal(false)
      setEditingWeight(null)
      setFormData({ category_id: '', weight_percent: '' })
      fetchWeights()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleEdit = (weight: Weight) => {
    setEditingWeight(weight)
    setFormData({
      category_id: weight.category_id,
      weight_percent: weight.weight_percent.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus bobot penilaian ini?')) return

    try {
      const { error } = await supabase
        .from('weights')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Bobot penilaian berhasil dihapus!')
      fetchWeights()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight.weight_percent, 0)
  const isWeightValid = totalWeight === 100

  const categoryOptions = categories
    .filter(cat => !weights.some(w => w.category_id === cat.id && (!editingWeight || w.id !== editingWeight.id)))
    .map(cat => ({
      value: cat.id,
      label: cat.name
    }))

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Bobot Penilaian</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bobot Penilaian</h1>
        <Button onClick={() => setShowModal(true)} disabled={categoryOptions.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Bobot
        </Button>
      </div>

      {/* Weight Summary */}
      <Card className={`border-2 ${isWeightValid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isWeightValid ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <Scale className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Total Bobot Penilaian</h3>
                <p className="text-sm text-gray-600">
                  {isWeightValid ? 'Bobot sudah seimbang' : 'Bobot belum seimbang, harus total 100%'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isWeightValid ? 'text-green-600' : 'text-orange-600'}`}>
                {totalWeight}%
              </p>
              <p className="text-sm text-gray-600">dari 100%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada kategori penilaian.</p>
            <p className="text-sm text-gray-400 mt-2">Buat kategori penilaian terlebih dahulu sebelum menentukan bobot.</p>
          </CardContent>
        </Card>
      )}

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Daftar Bobot Penilaian</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Kategori</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Deskripsi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Bobot</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {weights.map((weight) => (
                    <tr key={weight.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {weight.category?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {weight.category?.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {weight.weight_percent}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(weight)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(weight.id)}
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

            {weights.length === 0 && (
              <div className="text-center py-8">
                <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada bobot penilaian yang ditetapkan.</p>
                <Button onClick={() => setShowModal(true)} className="mt-4" disabled={categoryOptions.length === 0}>
                  Tambah Bobot Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingWeight(null)
          setFormData({ category_id: '', weight_percent: '' })
        }}
        title={editingWeight ? 'Edit Bobot Penilaian' : 'Tambah Bobot Penilaian'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Kategori Penilaian"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            options={categoryOptions}
            required
          />
          
          <Input
            label="Bobot (%)"
            type="number"
            min="0"
            max="100"
            value={formData.weight_percent}
            onChange={(e) => setFormData({ ...formData, weight_percent: e.target.value })}
            placeholder="Masukkan bobot 0-100"
            required
          />

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Sisa bobot yang tersedia:</strong> {100 - totalWeight + (editingWeight ? editingWeight.weight_percent : 0)}%
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingWeight(null)
                setFormData({ category_id: '', weight_percent: '' })
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              {editingWeight ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}