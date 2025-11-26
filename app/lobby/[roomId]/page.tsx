'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/lib/store'
import { Player, Room } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Play, Copy, Users, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string
  const { currentRoom, currentPlayer, setPlayers, setCurrentRoom } = useGameStore()
  const [players, setPlayersLocal] = useState<Player[]>([])
  const [room, setRoomLocal] = useState<Room | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!roomId) return

    // Загружаем комнату и игроков
    loadRoomData()

    // Подписываемся на изменения игроков
    const playersSubscription = supabase
      .channel(`room:${roomId}:players`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadRoomData()
        }
      )
      .subscribe()

    // Подписываемся на изменения комнаты
    const roomSubscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoomLocal(payload.new as Room)
          if ((payload.new as Room).status === 'playing') {
            router.push(`/game/${roomId}`)
          }
        }
      )
      .subscribe()

    return () => {
      playersSubscription.unsubscribe()
      roomSubscription.unsubscribe()
    }
  }, [roomId])

  const loadRoomData = async () => {
    try {
      // Загружаем комнату
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError
      setRoomLocal(roomData)
      setCurrentRoom(roomData)

      // Загружаем игроков
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('position', { ascending: true })

      if (playersError) throw playersError
      setPlayersLocal(playersData || [])
      setPlayers(playersData || [])
    } catch (error: any) {
      console.error('Error loading room data:', error)
      toast.error('Ошибка загрузки данных')
    }
  }

  const handleStartGame = async () => {
    if (!currentPlayer?.is_host) {
      toast.error('Только хост может начать игру')
      return
    }

    if (players.length < 4) {
      toast.error('Минимум 4 игрока для начала игры')
      return
    }

    setLoading(true)

    try {
      // Обновляем статус комнаты
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', roomId)

      if (roomError) throw roomError

      // Создаем игру
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          room_id: roomId,
          round_number: 1,
          current_phase: 'discussion',
        })
        .select()
        .single()

      if (gameError) throw gameError

      // Генерируем и раздаем карты
      await distributeCards(game.id)

      router.push(`/game/${roomId}`)
    } catch (error: any) {
      console.error('Error starting game:', error)
      toast.error(error.message || 'Ошибка при запуске игры')
    } finally {
      setLoading(false)
    }
  }

  const distributeCards = async (gameId: string) => {
    const { generateRandomCard } = await import('@/lib/gameLogic')

    for (const player of players) {
      const cardData = generateRandomCard()

      // Создаем карту в БД
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert(cardData)
        .select()
        .single()

      if (cardError) throw cardError

      // Привязываем карту к игроку
      await supabase
        .from('player_cards')
        .insert({
          game_id: gameId,
          player_id: player.id,
          card_id: card.id,
          revealed: {
            profession: true,
            age: true,
            gender: true,
            health: true,
            hobby: true,
            baggage: true,
            phobia: true,
            fact: true,
          },
        })
    }
  }

  const copyRoomCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code)
      toast.success('Код скопирован!')
    }
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bunker-accent mx-auto"></div>
          <p className="mt-4 text-gray-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 p-8 rounded-lg border border-gray-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-bunker-accent">Лобби</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Код комнаты:</span>
                  <span className="text-2xl font-bold text-white tracking-widest">{room.room_code}</span>
                  <button
                    onClick={copyRoomCode}
                    className="p-2 hover:bg-gray-800 rounded transition-colors"
                    title="Копировать код"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span>{players.length} / {room.max_players}</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Игроки ({players.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    player.is_host
                      ? 'border-bunker-accent bg-bunker-accent/10'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{player.username}</p>
                      {player.is_host && (
                        <span className="text-xs text-bunker-accent">Хост</span>
                      )}
                    </div>
                    <div className="text-gray-400">#{player.position}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {currentPlayer?.is_host && (
            <button
              onClick={handleStartGame}
              disabled={loading || players.length < 4}
              className="w-full px-6 py-4 bg-bunker-accent hover:bg-bunker-accentHover text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {loading ? 'Запуск игры...' : 'Начать игру'}
            </button>
          )}

          {!currentPlayer?.is_host && (
            <div className="text-center text-gray-400 py-4">
              Ожидание начала игры...
            </div>
          )}

          {players.length < 4 && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Минимум 4 игрока для начала игры
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

