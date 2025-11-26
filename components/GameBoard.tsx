'use client'

import { Game, Player, Card } from '@/lib/types'
import CardDisplay from './CardDisplay'
import VotingPanel from './VotingPanel'
import PlayerList from './PlayerList'
import Timer from './Timer'

interface GameBoardProps {
  game: Game
  currentPlayer: Player
  onVote: (targetPlayerId: string) => void
  onRevealCard: (cardType: string) => void
  onStartGame: () => void
}

export default function GameBoard({
  game,
  currentPlayer,
  onVote,
  onRevealCard,
  onStartGame,
}: GameBoardProps) {
  const isHost = game.players[0]?.id === currentPlayer.id
  const canStart = game.status === 'waiting' && game.players.length >= 4 && isHost

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-text p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-orbitron font-black text-3xl text-cyber-yellow uppercase tracking-wider mb-2">
              БУНКЕР - Раунд {game.currentRound}
            </h1>
            <p className="text-cyber-text-gray">
              Фаза: {game.currentPhase === 'bunker-reveal' ? 'Открытие карты бункера' :
                     game.currentPhase === 'presentation' ? 'Представление' :
                     game.currentPhase === 'voting' ? 'Голосование' : 'Результаты'}
            </p>
          </div>
          {canStart && (
            <button
              onClick={onStartGame}
              className="bg-cyber-yellow text-cyber-black px-6 py-3 font-orbitron font-bold uppercase tracking-wider hover:bg-cyber-yellow-dark transition-all"
            >
              Начать игру
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Игроки */}
          <div className="lg:col-span-1">
            <PlayerList
              players={game.players}
              currentPlayerId={currentPlayer.id}
              activePlayerId={game.activePlayerId}
            />
          </div>

          {/* Центральная колонка - Игровое поле */}
          <div className="lg:col-span-1">
            <div className="bg-cyber-dark border-2 border-cyber-yellow/30 p-6 rounded-lg">
              {game.status === 'waiting' && (
                <div className="text-center py-12">
                  <p className="text-cyber-text-gray mb-4">
                    Ожидание игроков... ({game.players.length}/10)
                  </p>
                  <p className="text-cyber-yellow font-orbitron text-xl">
                    ID комнаты: {game.id}
                  </p>
                </div>
              )}

              {game.status === 'playing' && (
                <>
                  {game.currentPhase === 'bunker-reveal' && (
                    <div className="text-center">
                      <h2 className="font-orbitron text-xl mb-4 text-cyber-yellow">
                        Откройте карту бункера
                      </h2>
                      {game.activePlayerId === currentPlayer.id && (
                        <button
                          onClick={() => onRevealCard('bunker')}
                          className="bg-cyber-yellow text-cyber-black px-8 py-4 font-orbitron font-bold uppercase"
                        >
                          Открыть карту
                        </button>
                      )}
                      {game.revealedBunkerCards.length > 0 && (
                        <div className="mt-6">
                          <CardDisplay
                            card={game.revealedBunkerCards[game.revealedBunkerCards.length - 1]}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {game.currentPhase === 'presentation' && (
                    <div>
                      <Timer seconds={30} />
                      <div className="mt-4">
                        <p className="text-cyber-text-gray mb-4">
                          Активный игрок представляет свою карту
                        </p>
                        {game.activePlayerId === currentPlayer.id && (
                          <div>
                            <p className="text-cyber-yellow mb-4">Ваша очередь!</p>
                            <div className="grid grid-cols-2 gap-4">
                              {currentPlayer.cards.map((card, index) => (
                                <CardDisplay key={index} card={card} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {game.currentPhase === 'voting' && (
                    <VotingPanel
                      players={game.players.filter(p => p.status === 'active')}
                      currentPlayer={currentPlayer}
                      onVote={onVote}
                    />
                  )}

                  {game.currentPhase === 'results' && (
                    <div className="text-center">
                      <h2 className="font-orbitron text-2xl text-cyber-yellow mb-6">
                        Игра завершена!
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-cyber-yellow mb-2">Выжившие:</h3>
                          {game.players
                            .filter(p => p.status === 'active')
                            .map(p => (
                              <p key={p.id} className="text-cyber-text">
                                {p.name}
                              </p>
                            ))}
                        </div>
                        <div>
                          <h3 className="text-cyber-neon-red mb-2">Исключённые:</h3>
                          {game.players
                            .filter(p => p.status === 'excluded')
                            .map(p => (
                              <p key={p.id} className="text-cyber-text-gray">
                                {p.name}
                              </p>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Правая колонка - Карты игрока */}
          <div className="lg:col-span-1">
            <div className="bg-cyber-dark border-2 border-cyber-neon-blue/30 p-6 rounded-lg">
              <h2 className="font-orbitron text-xl text-cyber-neon-blue mb-4">
                Ваши карты
              </h2>
              <div className="space-y-4">
                {currentPlayer.cards.map((card, index) => (
                  <CardDisplay key={index} card={card} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

