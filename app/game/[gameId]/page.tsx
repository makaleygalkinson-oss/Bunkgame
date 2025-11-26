'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Game, Player } from '@/lib/types'
import GameBoard from '@/components/GameBoard'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string

  const [game, setGame] = useState<Game | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const playerId = localStorage.getItem('playerId')
    const playerName = localStorage.getItem('playerName')

    if (!playerId || !playerName) {
      router.push('/')
      return
    }

    fetchGame()
    const interval = setInterval(fetchGame, 2000) // Обновление каждые 2 секунды

    return () => clearInterval(interval)
  }, [gameId, router])

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/game/${gameId}`)
      if (response.ok) {
        const gameData: Game = await response.json()
        setGame(gameData)

        const playerId = localStorage.getItem('playerId')
        const player = gameData.players.find((p) => p.id === playerId)
        if (player) {
          setCurrentPlayer(player)
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching game:', error)
      setLoading(false)
    }
  }

  const handleVote = async (targetPlayerId: string) => {
    const playerId = localStorage.getItem('playerId')
    if (!playerId) return

    try {
      const response = await fetch(`/api/game/${gameId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, targetPlayerId }),
      })

      if (response.ok) {
        fetchGame()
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleRevealCard = async (cardType: string) => {
    // Логика открытия карты
    fetchGame()
  }

  const handleStartGame = async () => {
    const playerId = localStorage.getItem('playerId')
    if (!playerId) return

    try {
      const response = await fetch(`/api/game/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })

      if (response.ok) {
        fetchGame()
      }
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="text-cyber-yellow font-orbitron text-2xl">Загрузка...</div>
      </div>
    )
  }

  if (!game || !currentPlayer) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="text-cyber-neon-red font-orbitron text-2xl">
          Игра не найдена
        </div>
      </div>
    )
  }

  return (
    <GameBoard
      game={game}
      currentPlayer={currentPlayer}
      onVote={handleVote}
      onRevealCard={handleRevealCard}
      onStartGame={handleStartGame}
    />
  )
}

