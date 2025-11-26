'use client'

import { useState } from 'react'
import { Player } from '@/lib/types'

interface VotingPanelProps {
  players: Player[]
  currentPlayer: Player
  onVote: (targetPlayerId: string) => void
}

export default function VotingPanel({ players, currentPlayer, onVote }: VotingPanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)

  const handleVote = () => {
    if (selectedPlayer && !voted) {
      onVote(selectedPlayer)
      setVoted(true)
    }
  }

  const availablePlayers = players.filter(p => p.id !== currentPlayer.id)

  return (
    <div className="text-center">
      <h2 className="font-orbitron text-2xl text-cyber-yellow mb-6">
        Голосование
      </h2>
      <p className="text-cyber-text-gray mb-6">
        Выберите игрока для исключения
      </p>

      {!voted ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {availablePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedPlayer === player.id
                    ? 'border-cyber-yellow bg-cyber-yellow/20 text-cyber-yellow'
                    : 'border-white/20 text-cyber-text hover:border-cyber-yellow/50'
                }`}
              >
                {player.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleVote}
            disabled={!selectedPlayer}
            className="bg-cyber-yellow text-cyber-black px-8 py-4 font-orbitron font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyber-yellow-dark transition-all"
          >
            Проголосовать
          </button>
        </>
      ) : (
        <div className="text-cyber-yellow font-orbitron text-xl">
          Ваш голос учтён. Ожидание других игроков...
        </div>
      )}
    </div>
  )
}

