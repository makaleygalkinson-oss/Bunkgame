import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function LobbyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Получаем профиль пользователя
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-cs-dark">
      {/* Header */}
      <header className="glass-strong border-b border-cs-orange/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="logo">
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cs-orange to-cs-yellow bg-clip-text text-transparent">
                COUNTER-STRIKE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-400">Вы вошли как</p>
                <p className="text-sm font-semibold text-white">
                  {user.email || 'Анонимный пользователь'}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white via-cs-orange to-cs-yellow bg-clip-text text-transparent">
            Добро пожаловать в лобби
          </h1>
          <p className="text-xl text-gray-300">
            {profile?.is_anonymous 
              ? 'Вы вошли как анонимный пользователь' 
              : `Добро пожаловать, ${user.email}!`}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Game Card */}
          <div className="glass rounded-xl p-6 border border-cs-orange/20 hover:border-cs-orange/40 transition-all cursor-pointer group">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cs-orange to-cs-orange-dark rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Начать игру</h3>
              <p className="text-gray-400 text-sm">Присоединитесь к матчу</p>
            </div>
            <button className="w-full bg-cs-orange text-white font-semibold py-2 px-4 rounded-lg hover:bg-cs-orange-dark transition-colors">
              Играть
            </button>
          </div>

          {/* Profile Card */}
          <div className="glass rounded-xl p-6 border border-cs-orange/20">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cs-yellow to-cs-orange rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Профиль</h3>
              <p className="text-gray-400 text-sm">Управление аккаунтом</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ID:</span>
                <span className="text-white font-mono text-xs">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{user.email || 'Не указан'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Тип:</span>
                <span className="text-cs-orange">
                  {profile?.is_anonymous ? 'Анонимный' : 'Обычный'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="glass rounded-xl p-6 border border-cs-orange/20">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cs-orange to-cs-yellow rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Статистика</h3>
              <p className="text-gray-400 text-sm">Ваши достижения</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Матчей:</span>
                <span className="text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Побед:</span>
                <span className="text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Рейтинг:</span>
                <span className="text-cs-yellow font-bold">-</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

