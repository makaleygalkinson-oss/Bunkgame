'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/lib/store'
import { Player, Game, PlayerCard, Card } from '@/lib/supabase'
import { formatTime } from '@/lib/gameLogic'
import toast from 'react-hot-toast'
import CardComponent from '@/components/Card'
import { Users, Clock, Vote, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string
  const { currentPlayer, players, setPlayers, setCurrentGame, playerCard, setPlayerCard, cardData, setCardData } = useGameStore()
  const [game, setGame] = useState<Game | null>(null)
  const [timeLeft, setTimeLeft] = useState(300)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [chatMessages, setChatMessages] = useState<Array<{ player: string; message: string; time: string }>>([])
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    if (!roomId) return

    loadGameData()

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
        (payload) => {
          setGame(payload.new as Game)
          setCurrentGame(payload.new as Game)
        }
      )
      .subscribe()

    // Подписка на голосования
    const votesSubscription = supabase
      .channel(`votes:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
        },
        () => {
          loadVotes()
        }
      )
      .subscribe()

    return () => {
      gameSubscription.unsubscribe()
      votesSubscription.unsubscribe()
    }
  }, [roomId])

  useEffect(() => {
    if (game?.current_phase === 'discussion' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Время вышло, переходим к голосованию
            if (game) {
              supabase
                .from('games')
                .update({ current_phase: 'voting' })
                .eq('id', game.id)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [game, timeLeft])

  // Проверка завершения голосования
  useEffect(() => {
    if (game?.current_phase === 'voting' && players.length > 0 && currentPlayer) {
      const checkVotingComplete = async () => {
        const { data: votesData } = await supabase
          .from('votes')
          .select('*')
          .eq('game_id', game.id)
          .eq('round_number', game.round_number)

        if (votesData) {
          const alivePlayers = players.filter((p) => p.is_alive)
          const votedPlayers = new Set(votesData.map((v) => v.voter_id))

          // Если все живые игроки проголосовали
          if (alivePlayers.every((p) => votedPlayers.has(p.id))) {
            // Переходим к результатам
            router.push(`/results/${roomId}`)
          }
        }
      }

      const interval = setInterval(checkVotingComplete, 2000)
      return () => clearInterval(interval)
    }
  }, [game, players, currentPlayer, roomId, router])

  const loadGameData = async () => {
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
        setCurrentGame(gameData)
        setTimeLeft(gameData.current_phase === 'discussion' ? 300 : 60)

        // Загружаем карту текущего игрока
        if (currentPlayer) {
          const { data: playerCardData } = await supabase
            .from('player_cards')
            .select(`
              *,
              cards (
                profession,
                age,
                gender,
                health,
                hobby,
                baggage,
                phobia,
                fact
              )
            `)
            .eq('game_id', gameData.id)
            .eq('player_id', currentPlayer.id)
            .single()

          if (playerCardData && playerCardData.cards) {
            setPlayerCard(playerCardData as any)
            setCardData((playerCardData as any).cards)
          }
        }

        // Загружаем игроков
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomId)
          .eq('is_alive', true)
          .order('position', { ascending: true })

        if (playersData) {
          setPlayers(playersData)
        }

        // Загружаем голоса
        if (gameData.current_phase === 'voting') {
          loadVotes()
        }
      }
    } catch (error: any) {
      console.error('Error loading game data:', error)
    }
  }

  const loadVotes = async () => {
    if (!game) return

    try {
      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('game_id', game.id)
        .eq('round_number', game.round_number)

      if (votesData) {
        const voteCounts: Record<string, number> = {}
        votesData.forEach((vote) => {
          voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
        })
        setVotes(voteCounts)

        // Проверяем, голосовал ли текущий игрок
        if (currentPlayer) {
          const hasVotedCheck = votesData.some((v) => v.voter_id === currentPlayer.id)
          setHasVoted(hasVotedCheck)
        }
      }
    } catch (error: any) {
      console.error('Error loading votes:', error)
    }
  }

  const handleVote = async () => {
    if (!selectedPlayer || !game || !currentPlayer || hasVoted) return

    try {
      await supabase.from('votes').insert({
        game_id: game.id,
        round_number: game.round_number,
        voter_id: currentPlayer.id,
        target_id: selectedPlayer,
      })

      setHasVoted(true)
      toast.success('Ваш голос учтен!')
      loadVotes()
    } catch (error: any) {
      console.error('Error voting:', error)
      toast.error('Ошибка при голосовании')
    }
  }

  const sendMessage = () => {
    if (!chatInput.trim() || !currentPlayer) return

    const newMessage = {
      player: currentPlayer.username,
      message: chatInput.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => [...prev, newMessage])
    setChatInput('')
  }

  if (!game || !cardData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bunker-accent mx-auto"></div>
          <p className="mt-4 text-gray-400">Загрузка игры...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Левая панель - Игроки */}
        <div className="lg:col-span-3 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
          <h3 className="text-xl font-bold mb-4 text-bunker-accent flex items-center gap-2">
            <Users className="w-5 h-5" />
            Игроки
          </h3>
          <div className="space-y-2">
            {players
              .filter((p) => p.is_alive)
              .map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPlayer === player.id
                      ? 'border-bunker-accent bg-bunker-accent/20'
                      : 'border-gray-700 bg-gray-800/50'
                  } ${
                    player.id === currentPlayer?.id ? 'ring-2 ring-bunker-safe' : ''
                  }`}
                  onClick={() => {
                    if (game.current_phase === 'voting' && !hasVoted && player.id !== currentPlayer?.id) {
                      setSelectedPlayer(player.id)
                    }
                  }}
                >
                  <p className="font-semibold text-white">{player.username}</p>
                  {votes[player.id] && (
                    <p className="text-sm text-bunker-accent">Голосов: {votes[player.id]}</p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Центральная панель - Игра */}
        <div className="lg:col-span-6 space-y-4">
          {/* Таймер и фаза */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Раунд {game.round_number}</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xl font-bold text-bunker-accent">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold text-white">
                {game.current_phase === 'discussion' ? 'Обсуждение' : 'Голосование'}
              </span>
            </div>
          </div>

          {/* Карта игрока */}
          {cardData && (
            <CardComponent card={cardData} isOwnCard={true} />
          )}

          {/* Голосование */}
          {game.current_phase === 'voting' && !hasVoted && (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-bold mb-4 text-bunker-accent flex items-center gap-2">
                <Vote className="w-5 h-5" />
                Голосование
              </h3>
              <p className="text-gray-400 mb-4">
                Выберите игрока, который должен покинуть бункер
              </p>
              <button
                onClick={handleVote}
                disabled={!selectedPlayer}
                className="w-full px-6 py-3 bg-bunker-accent hover:bg-bunker-accentHover text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Проголосовать
              </button>
            </div>
          )}

          {hasVoted && (
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 text-center">
              <p className="text-gray-400">Вы уже проголосовали. Ожидание других игроков...</p>
            </div>
          )}
        </div>

        {/* Правая панель - Чат */}
        <div className="lg:col-span-3 bg-gray-900/50 p-4 rounded-lg border border-gray-800 flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-bunker-accent flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Чат
          </h3>
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="text-sm">
                <span className="text-bunker-accent font-semibold">{msg.player}:</span>
                <span className="text-gray-300 ml-2">{msg.message}</span>
                <span className="text-gray-500 text-xs ml-2">{msg.time}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-bunker-accent"
              placeholder="Написать сообщение..."
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-bunker-accent hover:bg-bunker-accentHover text-white rounded-lg transition-all"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

