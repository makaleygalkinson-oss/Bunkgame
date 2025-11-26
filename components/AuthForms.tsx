'use client'

import { useState } from 'react'
import { signUp, signIn, signInWithGoogle, signInAnonymously } from '@/app/actions/auth'
import { toast } from 'sonner'

export default function AuthForms() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const result = isSignUp 
      ? await signUp(formData)
      : await signIn(formData)

    setIsLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(isSignUp ? 'Регистрация успешна!' : 'Вход выполнен!')
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    const result = await signInWithGoogle()
    if (result?.error) {
      setIsLoading(false)
      toast.error(result.error)
    }
  }

  async function handleAnonymousSignIn() {
    setIsLoading(true)
    const result = await signInAnonymously()
    if (result?.error) {
      setIsLoading(false)
      toast.error(result.error)
    } else {
      toast.success('Анонимный вход выполнен!')
    }
  }

  return (
    <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-cs-orange/30" data-auth-form>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-white">
          {isSignUp ? 'Регистрация' : 'Вход'}
        </h2>
        <p className="text-gray-400 text-sm">
          {isSignUp 
            ? 'Создайте аккаунт для доступа к игре' 
            : 'Войдите в свой аккаунт'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={isLoading}
            className="w-full px-4 py-3 bg-cs-gray/50 border border-cs-orange/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cs-orange focus:border-transparent transition-all disabled:opacity-50"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            minLength={isSignUp ? 6 : 1}
            className="w-full px-4 py-3 bg-cs-gray/50 border border-cs-orange/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cs-orange focus:border-transparent transition-all disabled:opacity-50"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cs-orange to-cs-orange-dark text-white font-bold py-3 px-6 rounded-lg hover:from-cs-orange-dark hover:to-cs-orange transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-cs-orange/20"
        >
          {isLoading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
        </button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cs-orange/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-cs-dark-gray text-gray-400">или</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Войти через Google
        </button>

        {/* Раскомментируйте, если VK поддерживается */}
        {/*
        <button
          onClick={handleVKSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#0077FF] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#0066DD] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.785 16.241s.287-.032.435-.194c.135-.148.132-.427.132-.653 0-.354.005-1.051-.002-1.635l.01-2.324s-.005-.24.164-.24h.7c.156 0 .214.107.214.214 0 .22.003.54.01.93.002.19.004.39.004.39s.005.107.09.18l.18.14c.25.19.67.64 1.5 1.38 1.07.95 1.57 1.4 1.75 1.6.18.2.31.4.31.65 0 .24-.08.48-.24.66-.15.18-.35.27-.65.27-.25 0-.55-.04-.95-.15-.52-.14-1.22-.44-2.11-.78-.9-.35-1.58-.54-1.83-.57-.29-.03-.5.02-.65.15-.15.12-.22.3-.22.52v1.45c0 .16-.01.25-.09.33-.08.08-.24.12-.48.12-.35 0-.95-.11-1.68-.48-1.18-.58-2.07-1.25-2.64-1.6-1.08-.7-1.89-1.54-2.42-2.52-.53-.98-.8-1.9-.8-2.76 0-.86.27-1.78.8-2.76.53-.98 1.34-1.82 2.42-2.52.57-.35 1.46-1.02 2.64-1.6.73-.37 1.33-.48 1.68-.48.24 0 .4.04.48.12.08.08.09.17.09.33v1.1c0 .22.07.4.22.52.15.13.36.18.65.15.25-.03.93-.22 1.83-.57.89-.34 1.59-.64 2.11-.78.4-.11.7-.15.95-.15.3 0 .5.09.65.27.16.18.24.42.24.66 0 .25-.13.45-.31.65-.18.2-.68.65-1.75 1.6-.83.74-1.25 1.19-1.5 1.38l-.18.14c-.085.073-.09.18-.09.18s-.002.2-.004.39c-.007.39-.01.71-.01.93 0 .107-.058.214-.214.214h-.7c-.169 0-.164.24-.164.24l.01 2.324c.007.584.002 1.281.002 1.635 0 .226.003.505.132.653.148.162.435.194.435.194z"/>
          </svg>
          Войти через VK
        </button>
        */}

        <button
          onClick={handleAnonymousSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-cs-gray/50 text-white font-semibold py-3 px-6 rounded-lg border border-cs-orange/30 hover:bg-cs-gray hover:border-cs-orange/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Анонимный вход
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-cs-orange hover:text-cs-yellow transition-colors"
          data-signup-toggle={!isSignUp ? true : undefined}
          data-signin-toggle={isSignUp ? true : undefined}
        >
          {isSignUp 
            ? 'Уже есть аккаунт? Войти' 
            : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  )
}

