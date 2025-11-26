'use client'

import { Card } from '@/lib/types'

interface CardDisplayProps {
  card: Card
  onClick?: () => void
  revealed?: boolean
}

export default function CardDisplay({ card, onClick, revealed = true }: CardDisplayProps) {
  const cardTypeColors: Record<string, string> = {
    profession: 'border-cyber-yellow text-cyber-yellow',
    biology: 'border-cyber-neon-blue text-cyber-neon-blue',
    health: 'border-cyber-neon-red text-cyber-neon-red',
    hobby: 'border-cyber-neon-pink text-cyber-neon-pink',
    baggage: 'border-cyber-yellow text-cyber-yellow',
    fact: 'border-cyber-neon-blue text-cyber-neon-blue',
    bunker: 'border-cyber-yellow text-cyber-yellow bg-cyber-yellow/10',
  }

  const cardTypeLabels: Record<string, string> = {
    profession: 'Профессия',
    biology: 'Биология',
    health: 'Здоровье',
    hobby: 'Хобби',
    baggage: 'Багаж',
    fact: 'Факт',
    bunker: 'Бункер',
  }

  const colorClass = cardTypeColors[card.type] || 'border-cyber-text text-cyber-text'

  return (
    <div
      className={`border-2 ${colorClass} p-4 rounded-lg transition-all ${
        onClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''
      } ${!revealed ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      <div className="font-orbitron text-xs uppercase tracking-wider mb-2 opacity-70">
        {cardTypeLabels[card.type] || card.type}
      </div>
      <div className="font-roboto text-sm">
        {revealed ? card.text : '???'}
      </div>
    </div>
  )
}

