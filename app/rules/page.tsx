'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RulesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-bunker-dark to-bunker-darker p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 p-8 rounded-lg border border-gray-800"
        >
          <h1 className="text-4xl font-bold mb-8 text-bunker-accent">📖 Правила игры</h1>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold mb-3 text-white">🎯 Цель игры</h2>
              <p>
                Апокалипсис наступил, и бункер может вместить только ограниченное количество людей.
                Ваша задача - убедить других игроков, что именно вы должны попасть в бункер.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3 text-white">🎴 Карты</h2>
              <p className="mb-2">Каждый игрок получает карту с характеристиками:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Профессия</strong> - ваша специальность</li>
                <li><strong>Возраст</strong> - сколько вам лет</li>
                <li><strong>Пол</strong> - ваш пол</li>
                <li><strong>Здоровье</strong> - состояние вашего здоровья</li>
                <li><strong>Хобби</strong> - ваши увлечения</li>
                <li><strong>Багаж</strong> - что вы взяли с собой</li>
                <li><strong>Фобия</strong> - ваш страх</li>
                <li><strong>Факт</strong> - дополнительная информация</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3 text-white">🎮 Ход игры</h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Игроки получают случайные карты</li>
                <li>Начинается обсуждение - каждый может рассказать о себе (не раскрывая все карты)</li>
                <li>После обсуждения начинается голосование</li>
                <li>Игрок с наибольшим количеством голосов "против" выбывает</li>
                <li>Игра продолжается до тех пор, пока не останется нужное количество игроков</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3 text-white">💡 Стратегия</h2>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Используйте свои сильные стороны (полезная профессия, хорошее здоровье)</li>
                <li>Скрывайте слабости (фобии, плохое здоровье)</li>
                <li>Убеждайте других, что вы полезны для выживания</li>
                <li>Обращайте внимание на характеристики других игроков</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3 text-white">⚙️ Настройки</h2>
              <p>
                Создатель комнаты может настроить количество игроков (от 4 до 16),
                время на обсуждение и другие параметры игры.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

