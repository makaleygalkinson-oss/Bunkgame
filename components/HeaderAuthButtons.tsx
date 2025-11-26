'use client'

export default function HeaderAuthButtons() {
  const scrollToForm = (isSignUp: boolean) => {
    const form = document.querySelector('[data-auth-form]') as HTMLElement
    const toggleBtn = document.querySelector(
      isSignUp ? '[data-signup-toggle]' : '[data-signin-toggle]'
    ) as HTMLElement
    
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (toggleBtn) {
        setTimeout(() => toggleBtn.click(), 500)
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => scrollToForm(true)}
        className="text-sm font-bold uppercase tracking-wider text-white hover:text-cs-orange transition-colors"
      >
        Регистрация
      </button>
      <button
        onClick={() => scrollToForm(false)}
        className="bg-cs-orange hover:bg-cs-orange-dark text-white font-bold py-2 px-6 rounded-lg transition-all text-sm uppercase tracking-wider"
      >
        Войти
      </button>
    </div>
  )
}

