'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateLobbyModal from '@/components/CreateLobbyModal'
import JoinLobbyModal from '@/components/JoinLobbyModal'

export default function Home() {
  const router = useRouter()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  const handleCreateLobby = async (data: { playerName: string; roomName: string; activeRoles: string }) => {
    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: data.playerName,
          roomName: data.roomName,
          mode: 'basic',
          activeRoles: [data.activeRoles],
        }),
      })

      if (response.ok) {
        const game = await response.json()
        // Сохраняем данные игрока в localStorage
        localStorage.setItem('playerName', data.playerName)
        localStorage.setItem('playerId', game.playerId)
        router.push(`/game/${game.gameId}`)
      } else {
        alert('Ошибка при создании лобби')
      }
    } catch (error) {
      console.error('Error creating lobby:', error)
      alert('Ошибка при создании лобби')
    }
  }

  const handleJoinLobby = async (data: { playerName: string; gameId: string }) => {
    try {
      const response = await fetch(`/api/game/${data.gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: data.playerName,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        localStorage.setItem('playerName', data.playerName)
        localStorage.setItem('playerId', result.playerId)
        router.push(`/game/${data.gameId}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Ошибка при присоединении к лобби')
      }
    } catch (error) {
      console.error('Error joining lobby:', error)
      alert('Ошибка при присоединении к лобби')
    }
  }

  return (
    <>
      <section className="mt-[70px] min-h-[calc(100vh-70px)] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] w-full min-h-[calc(100vh-70px)]">
          <div className="bg-cyber-yellow text-cyber-black flex flex-col justify-center items-center p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)] pointer-events-none"></div>
            <h1 className="font-orbitron font-black text-5xl lg:text-7xl text-center mb-12 leading-tight uppercase tracking-wider relative z-10">
              ПОЛНОЕ ПОГРУЖЕНИЕ В<br />БУНКЕР
            </h1>
            <div className="flex flex-col lg:flex-row gap-8 mb-12 relative z-10">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="bg-transparent text-cyber-black border-[3px] border-cyber-black px-10 py-4 font-bold uppercase cursor-pointer transition-all text-base tracking-wider font-orbitron hover:bg-cyber-black hover:text-cyber-yellow hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
              >
                Создать Лобби
              </button>
              <button
                onClick={() => setJoinModalOpen(true)}
                className="bg-transparent text-cyber-black border-[3px] border-cyber-black px-10 py-4 font-bold uppercase cursor-pointer transition-all text-base tracking-wider font-orbitron hover:bg-cyber-black hover:text-cyber-yellow hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
              >
                Присоединиться к лобби
              </button>
            </div>
            <div className="flex flex-wrap gap-6 justify-center relative z-10">
              <div className="px-5 py-2.5 bg-black/10 border-2 border-cyber-black font-semibold text-sm uppercase tracking-wide">
                Xbox Series X|S
              </div>
              <div className="px-5 py-2.5 bg-black/10 border-2 border-cyber-black font-semibold text-sm uppercase tracking-wide">
                PS5
              </div>
              <div className="px-5 py-2.5 bg-black/10 border-2 border-cyber-black font-semibold text-sm uppercase tracking-wide">
                PC
              </div>
              <div className="px-5 py-2.5 bg-black/10 border-2 border-cyber-black font-semibold text-sm uppercase tracking-wide">
                Nintendo Switch
              </div>
              <div className="px-5 py-2.5 bg-black/10 border-2 border-cyber-black font-semibold text-sm uppercase tracking-wide">
                MAC
              </div>
            </div>
          </div>
          <div className="bg-cyber-dark relative overflow-hidden flex items-center justify-center">
            <div className="neon-grid"></div>
            <div className="glitch-overlay"></div>
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="text-8xl drop-shadow-[0_0_20px_rgba(0,255,255,1)] animate-pulse-neon">👤</div>
              <div className="flex flex-col gap-4 w-48">
                <div className="h-1 bg-gradient-to-r from-transparent via-cyber-neon-pink via-cyber-neon-blue via-cyber-neon-pink to-transparent shadow-[0_0_10px_rgba(255,0,255,1)] animate-line-flow"></div>
                <div className="h-1 bg-gradient-to-r from-transparent via-cyber-neon-pink via-cyber-neon-blue via-cyber-neon-pink to-transparent shadow-[0_0_10px_rgba(255,0,255,1)] animate-line-flow" style={{ animationDelay: '0.3s' }}></div>
                <div className="h-1 bg-gradient-to-r from-transparent via-cyber-neon-pink via-cyber-neon-blue via-cyber-neon-pink to-transparent shadow-[0_0_10px_rgba(255,0,255,1)] animate-line-flow" style={{ animationDelay: '0.6s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cyber-black py-12 border-t border-white/10">
        <div className="news-header flex justify-between items-center px-8 pb-4 border-b border-white/10 mb-8">
          <div className="font-orbitron text-xs text-cyber-text-gray uppercase tracking-wider">
            /// NEWS.MODULE_HIGHLIGHT
          </div>
          <div className="font-orbitron text-sm text-cyber-text">28.10.2025</div>
          <div className="font-orbitron text-xl text-cyber-yellow uppercase tracking-wider drop-shadow-[0_0_10px_rgba(255,215,0,1)]">
            NEWS
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-8 px-8">
          <div className="bg-cyber-neon-red p-12 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
            <div className="font-orbitron font-black text-3xl text-cyber-black uppercase tracking-widest relative z-10">
              БУНКЕР
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { emoji: '🎮', text: 'БУНКЕР ULTIMATE EDITION' },
              { emoji: '⚡', text: 'НОВОЕ ОБНОВЛЕНИЕ' },
              { emoji: '🔮', text: 'РАСШИРЕНИЕ' },
              { emoji: '🌟', text: 'СОБЫТИЯ' },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-cyber-gray border border-white/10 p-8 cursor-pointer transition-all relative overflow-hidden hover:border-cyber-yellow hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-yellow/10 to-cyber-neon-pink/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                <div className="text-5xl mb-4 drop-shadow-[0_0_10px_rgba(0,255,255,1)] relative z-10">{item.emoji}</div>
                <div className="font-orbitron text-sm text-cyber-text uppercase tracking-wide relative z-10">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CreateLobbyModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateLobby}
      />
      <JoinLobbyModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSubmit={handleJoinLobby}
      />
    </>
  )
}

