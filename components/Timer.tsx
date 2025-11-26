'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  seconds: number
  onComplete?: () => void
}

export default function Timer({ seconds, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  const percentage = (timeLeft / seconds) * 100
  const colorClass = timeLeft <= 10 ? 'text-cyber-neon-red' : 'text-cyber-yellow'

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="font-orbitron text-sm uppercase">Время</span>
        <span className={`font-orbitron text-2xl font-bold ${colorClass}`}>
          {timeLeft}
        </span>
      </div>
      <div className="w-full bg-cyber-gray h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            timeLeft <= 10 ? 'bg-cyber-neon-red' : 'bg-cyber-yellow'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

