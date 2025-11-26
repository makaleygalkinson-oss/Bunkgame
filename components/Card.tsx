'use client'

import { motion } from 'framer-motion'

interface CardData {
  profession: string
  age: number
  gender: string
  health: string
  hobby: string
  baggage: string
  phobia: string
  fact: string
}

interface CardProps {
  card: CardData
  revealed?: {
    profession?: boolean
    age?: boolean
    gender?: boolean
    health?: boolean
    hobby?: boolean
    baggage?: boolean
    phobia?: boolean
    fact?: boolean
  }
  isOwnCard?: boolean
}

export default function Card({ card, revealed, isOwnCard = false }: CardProps) {
  const defaultRevealed = {
    profession: true,
    age: true,
    gender: true,
    health: true,
    hobby: true,
    baggage: true,
    phobia: true,
    fact: true,
    ...revealed,
  }

  return (
    <motion.div
      initial={{ rotateY: 0 }}
      animate={{ rotateY: 360 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-bunker-accent shadow-lg shadow-bunker-accent/20 max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-bunker-accent mb-2">
          {isOwnCard ? 'Ваша карта' : 'Карта игрока'}
        </h3>
        <div className="w-20 h-1 bg-bunker-accent mx-auto"></div>
      </div>

      <div className="space-y-4">
        {defaultRevealed.profession && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Профессия:</span>
            <p className="text-white font-semibold">{card.profession}</p>
          </div>
        )}

        {defaultRevealed.age && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Возраст:</span>
            <p className="text-white font-semibold">{card.age} лет</p>
          </div>
        )}

        {defaultRevealed.gender && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Пол:</span>
            <p className="text-white font-semibold">{card.gender}</p>
          </div>
        )}

        {defaultRevealed.health && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Здоровье:</span>
            <p className="text-white font-semibold">{card.health}</p>
          </div>
        )}

        {defaultRevealed.hobby && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Хобби:</span>
            <p className="text-white font-semibold">{card.hobby}</p>
          </div>
        )}

        {defaultRevealed.baggage && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Багаж:</span>
            <p className="text-white font-semibold">{card.baggage}</p>
          </div>
        )}

        {defaultRevealed.phobia && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Фобия:</span>
            <p className="text-white font-semibold">{card.phobia}</p>
          </div>
        )}

        {defaultRevealed.fact && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">Факт:</span>
            <p className="text-white font-semibold">{card.fact}</p>
          </div>
        )}

        {!isOwnCard && Object.values(defaultRevealed).some(v => !v) && (
          <div className="text-center text-gray-500 text-sm mt-4">
            Некоторые характеристики скрыты
          </div>
        )}
      </div>
    </motion.div>
  )
}

