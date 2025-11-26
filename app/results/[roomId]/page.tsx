'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player, Game } from '@/lib/supabase'
import { useGameStore } from '@/lib/store'
import { Trophy, Home, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string
  const { currentRoom, players, reset } = useGameStore()
  const [game, setGame] = useState<Game | null>(null)
  const [voteResults, setVoteResults] = useState<Record<string, number>>({})
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null)
  const [survivors, setSurvivors] = useState<Player[]>([])

  useEffect(() => {
    if (!roomId) return

    loadResults()

    // Подписка на изменения игры
    const gameSubscription = supabase
      .channel(`game:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadResults()
        }
      )
      .subscribe()

    return () => {
      gameSubscription.unsubscribe()
    }
  }, [roomId])

  const loadResults = async () => {
    try {
      // Загружаем игру
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (gameData) {
        setGame(gameData)

        // Загружаем голоса
        const { data: votesData } = await supabase
          .from('votes')
          .select('*')
          .eq('game_id', gameData.id)
          .eq('round_number', gameData.round_number)

        if (votesData) {
          const voteCounts: Record<string, number> = {}
          votesData.forEach((vote) => {
            voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
          })
          setVoteResults(voteCounts)

          // Находим игрока с наибольшим количеством голосов
          const maxVotes = Math.max(...Object.values(voteCounts))
          const eliminatedId = Object.keys(voteCounts).find(
            (id) => voteCounts[id] === maxVotes
          )

          if (eliminatedId) {
            const eliminated = players.find((p) => p.id === eliminatedId)
            setEliminatedPlayer(eliminated || null)

            // Обновляем статус игрока
            await supabase
              .from('players')
              .update({ is_alive: false })
              .eq('id', eliminatedId)

            // Обновляем количество живых игроков
            const alivePlayers = players.filter((p) => p.id !== eliminatedId && p.is_alive)
            setSurvivors(alivePlayers)

            // Если осталось нужное количество игроков, завершаем игру
            if (alivePlayers.length <= 3) {
              await supabase
                .from('games')
                .update({ finished_at: new Date().toISOString() })
                .eq('id', gameData.id)

              await supabase
                .from('rooms')
                .update({ status: 'finished' })
                .eq('id', roomId)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading results:', error)
    }
  }

  const handleNewGame = () => {
    reset()
    router.push('/')
  }

  const handleNextRound = async () => {
    if (!game) return

    try {
      // Обновляем раунд
      await supabase
        .from('games')
        .update({
          round_number: game.round_number + 1,
          current_phase: 'discussion',
        })
        .eq('id', game.id)

      // Очищаем голоса предыдущего раунда
      await supabase
        .from('votes')
        .delete()
        .eq('game_id', game.id)
        .eq('round_number', game.round_number)

      router.push(`/game/${roomId}`)
    } catch (error: any) {
      console.error('Error starting next round:', error)
      toast.error('Ошибка при переходе к следующему раунду')
    }
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bunker-accent mx-auto"></div>
          <p className="mt-4 text-gray-400">Загрузка результатов...</p>
        </div>
      </div>
    )
  }

  const isGameFinished = game.finished_at || survivors.length <= 3

  return (
    <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 p-8 rounded-lg border border-gray-800"
        >
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-bunker-accent mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2 text-bunker-accent">
              {isGameFinished ? 'Игра завершена!' : 'Результаты раунда'}
            </h1>
            <p className="text-gray-400">Раунд {game.round_number}</p>
          </div>

          {eliminatedPlayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-900/20 border-2 border-red-500 p-6 rounded-lg mb-6"
            >
              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Исключен из бункера
              </h2>
              <p className="text-xl text-white">{eliminatedPlayer.username}</p>
              <p className="text-gray-400 mt-2">
                Голосов против: {voteResults[eliminatedPlayer.id] || 0}
              </p>
            </motion.div>
          )}

          {isGameFinished && survivors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              delay={0.2}
              className="bg-bunker-safe/20 border-2 border-bunker-safe p-6 rounded-lg mb-6"
            >
              <h2 className="text-2xl font-bold text-bunker-safe mb-4">
                🎉 Выжившие в бункере
              </h2>
              <div className="space-y-2">
                {survivors.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-bunker-accent">
                        #{index + 1}
                      </span>
                      <span className="text-xl text-white">{player.username}</span>
                    </div>
                    <Trophy className="w-6 h-6 text-bunker-accent" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-white">Результаты голосования</h3>
            <div className="space-y-2">
              {Object.entries(voteResults)
                .sort(([, a], [, b]) => b - a)
                .map(([playerId, votes]) => {
                  const player = players.find((p) => p.id === playerId)
                  if (!player) return null
                  return (
                    <div
                      key={playerId}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <span className="text-white">{player.username}</span>
                      <span className="text-bunker-accent font-bold">{votes} голосов</span>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {!isGameFinished && (
              <button
                onClick={handleNextRound}
                className="flex-1 px-6 py-4 bg-bunker-accent hover:bg-bunker-accentHover text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Следующий раунд
              </button>
            )}
            <button
              onClick={handleNewGame}
              className="flex-1 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Главная
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

