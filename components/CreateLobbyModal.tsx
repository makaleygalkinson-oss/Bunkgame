'use client'

import { useState, useEffect } from 'react'
import { generateRoomId } from '@/lib/utils'

interface CreateLobbyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { playerName: string; roomName: string; activeRoles: string }) => void
}

export default function CreateLobbyModal({ isOpen, onClose, onSubmit }: CreateLobbyModalProps) {
  const [roomId, setRoomId] = useState('')
  const [formData, setFormData] = useState({
    playerName: '',
    roomName: '',
    activeRoles: '',
  })

  useEffect(() => {
    if (isOpen) {
      setRoomId(generateRoomId())
    } else {
      setFormData({ playerName: '', roomName: '', activeRoles: '' })
      setRoomId('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.playerName && formData.roomName && formData.activeRoles) {
      onSubmit(formData)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bg-cyber-yellow text-cyber-black px-8 py-6 flex justify-between items-center border-b-2 border-cyber-black">
          <h2 className="font-orbitron font-black text-2xl uppercase tracking-wider m-0">СОЗДАНИЕ ЛОББИ</h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-cyber-black text-3xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center transition-transform hover:rotate-90"
            aria-label="Закрыть"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label className="block font-orbitron text-sm text-cyber-yellow uppercase tracking-wide mb-2 drop-shadow-[0_0_5px_rgba(255,215,0,1)]">
              Введите свой Ник:
            </label>
            <input
              type="text"
              value={formData.playerName}
              onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
              required
              placeholder="Введите ваш никнейм"
              className="w-full px-4 py-3 bg-cyber-gray border-2 border-white/20 text-cyber-text font-roboto text-base transition-all outline-none focus:border-cyber-yellow focus:shadow-[0_0_10px_rgba(255,215,0,0.3)] focus:bg-cyber-dark"
            />
          </div>
          <div className="mb-6">
            <label className="block font-orbitron text-sm text-cyber-yellow uppercase tracking-wide mb-2 drop-shadow-[0_0_5px_rgba(255,215,0,1)]">
              Название комнаты:
            </label>
            <input
              type="text"
              value={formData.roomName}
              onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
              required
              placeholder="Введите название комнаты"
              className="w-full px-4 py-3 bg-cyber-gray border-2 border-white/20 text-cyber-text font-roboto text-base transition-all outline-none focus:border-cyber-yellow focus:shadow-[0_0_10px_rgba(255,215,0,0.3)] focus:bg-cyber-dark"
            />
          </div>
          <div className="mb-6">
            <label className="block font-orbitron text-sm text-cyber-yellow uppercase tracking-wide mb-2 drop-shadow-[0_0_5px_rgba(255,215,0,1)]">
              Активные роли:
            </label>
            <select
              value={formData.activeRoles}
              onChange={(e) => setFormData({ ...formData, activeRoles: e.target.value })}
              required
              className="w-full px-4 py-3 bg-cyber-gray border-2 border-white/20 text-cyber-text font-roboto text-base transition-all outline-none focus:border-cyber-yellow focus:shadow-[0_0_10px_rgba(255,215,0,0.3)] focus:bg-cyber-dark cursor-pointer"
            >
              <option value="">Выберите роль</option>
              <option value="Маньяк">Маньяк</option>
              <option value="Убийца">Убийца</option>
              <option value="Без ролей">Без ролей</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block font-orbitron text-sm text-cyber-yellow uppercase tracking-wide mb-2 drop-shadow-[0_0_5px_rgba(255,215,0,1)]">
              ID комнаты:
            </label>
            <div className="px-4 py-3 bg-cyber-gray border-2 border-cyber-yellow text-cyber-yellow font-orbitron font-bold text-lg text-center tracking-wider drop-shadow-[0_0_10px_rgba(255,215,0,1)] shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              {roomId || 'Генерируется...'}
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-cyber-yellow text-cyber-black font-orbitron font-bold uppercase tracking-wider cursor-pointer transition-all text-base border-none hover:bg-cyber-yellow-dark hover:shadow-[0_0_20px_rgba(255,215,0,1)] hover:-translate-y-0.5"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-transparent text-cyber-text border-2 border-white/30 font-orbitron font-bold uppercase tracking-wider cursor-pointer transition-all text-base hover:border-cyber-text hover:bg-white/10"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

