import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { 
  Users, 
  FileText, 
  Calendar, 
  CheckCircle, 
  BarChart3, 
  Shield, 
  Clock, 
  Globe,
  Star,
  ArrowRight,
  Menu,
  X
} from 'lucide-react'

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const features = [
    {
      icon: Users,
      title: "Manajemen Siswa & Kelas",
      description: "Kelola data siswa dan kelas dengan mudah. Import data dari Excel, organisir berdasarkan kelas, dan akses informasi siswa kapan saja."
    },
    {
      icon: FileText,
      title: "Input Nilai & Laporan Otomatis",
      description: "Input nilai dengan mode spreadsheet yang intuitif. Generate laporan nilai otomatis dengan berbagai format export (PDF, Excel)."
    },
    {
      icon: Calendar,
      title: "Pencatatan Kehadiran Akurat",
      description: "Catat kehadiran siswa harian dengan mudah. Mode input massal untuk efisiensi dan laporan kehadiran yang komprehensif."
    }
  ]

  const benefits = [
    {
      icon: Clock,
      title: "Hemat Waktu Administrasi",
      description: "Otomatisasi proses administrasi sekolah hingga 80% lebih cepat"
    },
    {
      icon: Shield,
      title: "Data Aman & Terpusat",
      description: "Sistem backup otomatis dan keamanan data tingkat enterprise"
    },
    {
      icon: Globe,
      title: "Akses Kapan Saja, Di Mana Saja",
      description: "Platform berbasis cloud yang dapat diakses dari perangkat apapun"
    },
    {
      icon: BarChart3,
      title: "Analisis & Laporan Mendalam",
      description: "Dashboard analitik dan laporan yang membantu pengambilan keputusan"
    }
  ]

  const testimonials = [
    {
      quote: "SUMATIF CLOUD benar-benar mengubah cara saya mengelola kelas. Sangat intuitif dan menghemat banyak waktu!",
      name: "Budi Santoso",
      role: "Guru Matematika, SMA Negeri 1",
      rating: 5
    },
    {
      quote: "Platform yang luar biasa! Fitur input nilai spreadsheet sangat membantu untuk mengelola ratusan siswa.",
      name: "Siti Nurhaliza",
      role: "Guru Bahasa Indonesia",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">SUMATIF CLOUD</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Fitur</a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">Keunggulan</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimoni</a>
              <Link to="/dashboard">
                <Button variant="primary">Masuk ke Aplikasi</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Fitur</a>
                <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">Keunggulan</a>
                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimoni</a>
                <Link to="/dashboard">
                  <Button variant="primary" className="w-full">Masuk ke Aplikasi</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              SUMATIF CLOUD
              <span className="block text-blue-600 mt-2">Kelola Nilai & Kehadiran</span>
              <span className="block text-gray-700 text-3xl md:text-4xl mt-2">dengan Mudah</span>
            </h1>
            
            <p className="text-xl text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed">
              Platform terintegrasi untuk guru dan sekolah modern. Kelola data siswa, input nilai, 
              catat kehadiran, dan generate laporan dengan mudah dan efisien.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-lg">
                  Mulai Sekarang!
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-4 text-lg">
                Lihat Demo
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              ✨ Terhubung. Tersimpan. Tertata. ✨
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-500"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Fitur Unggulan Kami
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Solusi lengkap untuk manajemen sekolah modern dengan teknologi terdepan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Mengapa Memilih SUMATIF CLOUD?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Keunggulan yang membuat kami menjadi pilihan utama ribuan guru di Indonesia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Apa Kata Pengguna Kami?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Testimoni dari guru-guru yang telah merasakan manfaat SUMATIF CLOUD
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg italic text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Mengoptimalkan Manajemen Sekolah Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan guru yang telah merasakan kemudahan mengelola kelas dengan SUMATIF CLOUD
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-50">
                Daftar Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-4 text-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600">
              Hubungi Kami
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">SUMATIF CLOUD</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Platform manajemen sekolah terdepan yang membantu guru dan sekolah 
                mengelola data siswa, nilai, dan kehadiran dengan mudah dan efisien.
              </p>
              <p className="text-sm text-gray-500">
                Terhubung. Tersimpan. Tertata.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Fitur</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Manajemen Siswa</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Input Nilai</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kehadiran</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Laporan</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Dukungan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Bantuan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} SUMATIF CLOUD. All rights reserved. • Created with ☕ by Rudy Susanto
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
