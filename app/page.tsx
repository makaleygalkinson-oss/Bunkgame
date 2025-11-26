'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Play, BookOpen } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-bunker-accent to-orange-400 bg-clip-text text-transparent">
          🎮 БУНКЕР
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Апокалипсис наступил. Бункер может вместить только ограниченное количество людей.
          Убедите других, что именно вы должны попасть внутрь.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mb-12"
      >
        <button
          onClick={() => router.push('/create')}
          className="px-8 py-4 bg-bunker-accent hover:bg-bunker-accentHover text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-bunker-accent/50"
        >
          <Play className="w-5 h-5" />
          Создать игру
        </button>
        <button
          onClick={() => router.push('/join')}
          className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          Присоединиться
        </button>
        <button
          onClick={() => router.push('/rules')}
          className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          Правила
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
      >
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
          <h3 className="text-xl font-bold mb-2 text-bunker-accent">🎯 Цель</h3>
          <p className="text-gray-400">
            Убедите других игроков, что именно вы должны попасть в бункер, используя свои характеристики.
          </p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
          <h3 className="text-xl font-bold mb-2 text-bunker-accent">👥 Игроки</h3>
          <p className="text-gray-400">
            От 4 до 16 игроков. Каждый получает случайную карту с уникальными характеристиками.
          </p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
          <h3 className="text-xl font-bold mb-2 text-bunker-accent">⏱️ Время</h3>
          <p className="text-gray-400">
            Обсуждение и голосование по раундам. Выживают только самые убедительные.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

