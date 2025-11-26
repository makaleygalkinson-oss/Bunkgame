'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { ArrowLeft, Hash } from 'lucide-react'

export default function JoinPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { setCurrentRoom, setCurrentPlayer } = useGameStore()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast.error('Введите имя')
      return
    }

    if (!roomCode.trim()) {
      toast.error('Введите код комнаты')
      return
    }

    setLoading(true)

    try {
      // Находим комнату по коду
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomError || !room) {
        toast.error('Комната не найдена')
        return
      }

      if (room.status !== 'waiting') {
        toast.error('Игра уже началась')
        return
      }

      if (room.current_players >= room.max_players) {
        toast.error('Комната заполнена')
        return
      }

      // Получаем текущих игроков для определения позиции
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)

      const position = (players?.length || 0) + 1

      // Создаем игрока
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          username: username.trim(),
          is_host: false,
          is_alive: true,
          position: position,
        })
        .select()
        .single()

      if (playerError) throw playerError

      // Обновляем количество игроков
      await supabase
        .from('rooms')
        .update({ current_players: position })
        .eq('id', room.id)

      setCurrentRoom(room)
      setCurrentPlayer(player)

      toast.success('Вы присоединились к комнате!')
      router.push(`/lobby/${room.id}`)
    } catch (error: any) {
      console.error('Error joining room:', error)
      toast.error(error.message || 'Ошибка при присоединении')
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
          <h1 className="text-4xl font-bold mb-8 text-bunker-accent">Присоединиться к игре</h1>

          <form onSubmit={handleJoin} className="space-y-6">
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
                <Hash className="w-4 h-4" />
                Код комнаты
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-bunker-accent text-center text-2xl font-bold tracking-widest"
                placeholder="XXXXXX"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-bunker-accent hover:bg-bunker-accentHover text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Присоединение...' : 'Присоединиться'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

