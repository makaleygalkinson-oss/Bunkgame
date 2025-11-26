'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/gameLogic'
import { useGameStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { ArrowLeft, Users, Clock } from 'lucide-react'

export default function CreatePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [roundTime, setRoundTime] = useState(300) // 5 минут
  const [loading, setLoading] = useState(false)
  const { setCurrentRoom, setCurrentPlayer } = useGameStore()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast.error('Введите имя')
      return
    }

    setLoading(true)

    try {
      const roomCode = generateRoomCode()
      const hostId = crypto.randomUUID()

      // Создаем комнату
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: roomCode,
          host_id: hostId,
          max_players: maxPlayers,
          current_players: 1,
          status: 'waiting',
          settings: {
            round_time: roundTime,
          },
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Создаем игрока-хоста
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          username: username.trim(),
          is_host: true,
          is_alive: true,
          position: 1,
        })
        .select()
        .single()

      if (playerError) throw playerError

      setCurrentRoom(room)
      setCurrentPlayer(player)

      toast.success('Комната создана!')
      router.push(`/lobby/${room.id}`)
    } catch (error: any) {
      console.error('Error creating room:', error)
      toast.error(error.message || 'Ошибка при создании комнаты')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад
        </button>

        <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">
          <h1 className="text-4xl font-bold mb-8 text-bunker-accent">Создать игру</h1>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Ваше имя</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-bunker-accent"
                placeholder="Введите ваше имя"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Максимум игроков
              </label>
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Math.max(4, Math.min(16, parseInt(e.target.value) || 4)))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-bunker-accent"
                min={4}
                max={16}
              />
              <p className="text-gray-500 text-sm mt-1">От 4 до 16 игроков</p>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Время на раунд (секунды)
              </label>
              <input
                type="number"
                value={roundTime}
                onChange={(e) => setRoundTime(Math.max(60, parseInt(e.target.value) || 300))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-bunker-accent"
                min={60}
                max={1800}
              />
              <p className="text-gray-500 text-sm mt-1">
                {Math.floor(roundTime / 60)} минут {roundTime % 60} секунд
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-bunker-accent hover:bg-bunker-accentHover text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Создание...' : 'Создать комнату'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

