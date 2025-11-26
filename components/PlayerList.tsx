'use client'

import { Player } from '@/lib/types'

interface PlayerListProps {
  players: Player[]
  currentPlayerId: string
  activePlayerId?: string
}

export default function PlayerList({ players, currentPlayerId, activePlayerId }: PlayerListProps) {
  return (
    <div className="bg-cyber-dark border-2 border-cyber-neon-pink/30 p-6 rounded-lg">
      <h2 className="font-orbitron text-xl text-cyber-neon-pink mb-4">
        Игроки ({players.length})
      </h2>
      <div className="space-y-3">
        {players.map((player) => {
          const isCurrent = player.id === currentPlayerId
          const isActive = player.id === activePlayerId
          const statusClass =
            player.status === 'excluded'
              ? 'border-cyber-neon-red text-cyber-neon-red opacity-50'
              : isActive
              ? 'border-cyber-yellow text-cyber-yellow'
              : 'border-white/20 text-cyber-text'

          return (
            <div
              key={player.id}
              className={`p-3 border-2 rounded-lg ${statusClass} ${
                isCurrent ? 'ring-2 ring-cyber-neon-blue' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-roboto font-medium">
                  {player.name} {isCurrent && '(Вы)'}
                </span>
                {isActive && (
                  <span className="text-xs font-orbitron uppercase">Активен</span>
                )}
                {player.status === 'excluded' && (
                  <span className="text-xs font-orbitron uppercase text-cyber-neon-red">
                    Исключён
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

