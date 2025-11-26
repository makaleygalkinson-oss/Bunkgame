import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthForms from '@/components/AuthForms'
import HeaderAuthButtons from '@/components/HeaderAuthButtons'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/lobby')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-cs-orange/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="logo">
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cs-orange to-cs-yellow bg-clip-text text-transparent">
                COUNTER-STRIKE
              </span>
            </div>
            <nav className="hidden md:flex gap-8 items-center">
              <a href="#" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors">
                Главная
              </a>
              <a href="#" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors">
                Новости
              </a>
              <a href="#" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors">
                Игры
              </a>
              <a href="#" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors">
                Сообщество
              </a>
            </nav>
            <HeaderAuthButtons />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-cs-dark via-cs-dark-gray to-cs-dark">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,107,0,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,215,0,0.1),transparent_50%)]"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left animate-fade-in">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6">
                <span className="block bg-gradient-to-r from-white via-cs-orange to-cs-yellow bg-clip-text text-transparent">
                  COUNTER-STRIKE
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 font-light tracking-wide">
                Тактический шутер от первого лица
              </p>
            </div>

            {/* Right: Auth Forms */}
            <div className="animate-fade-in flex justify-center lg:justify-end">
              <AuthForms />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

