'use client'

import { signOut } from '@/app/actions/auth'
import { useState } from 'react'
import { toast } from 'sonner'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    setIsLoading(true)
    try {
      await signOut()
      toast.success('Выход выполнен')
    } catch (error) {
      toast.error('Ошибка при выходе')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="bg-cs-gray/50 hover:bg-cs-gray text-white font-semibold py-2 px-4 rounded-lg border border-cs-orange/30 hover:border-cs-orange/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {isLoading ? 'Выход...' : 'Выйти'}
    </button>
  )
}

