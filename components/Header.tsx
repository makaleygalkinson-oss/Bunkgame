'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createProfile } from '@/lib/actions/profile';

export default function Header({ user }: { user: User | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Ошибка при выходе');
    } else {
      toast.success('Вы успешно вышли');
      router.push('/');
      router.refresh();
    }
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-menu') && !target.closest('.menu-toggle')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full bg-cyber-black z-50 border-b border-white/10">
        <nav className="py-4">
          <div className="container max-w-7xl mx-auto px-5 flex justify-between items-center">
            <div className="font-orbitron font-black text-2xl text-cyber-yellow uppercase tracking-wider">
              CYBERPUNK
            </div>
            <ul className={`hidden md:flex list-none gap-8 items-center ${isMenuOpen ? 'md:flex' : ''}`}>
              <li><a href="#games" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">ИГРЫ</a></li>
              <li><a href="#series" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">СЕРИАЛЫ</a></li>
              <li><a href="#community" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">СООБЩЕСТВО</a></li>
              <li><a href="#other" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">ПРОЧЕЕ</a></li>
              <li>
                <select className="bg-transparent border border-white/30 text-cyber-text px-2.5 py-1.5 text-sm cursor-pointer uppercase">
                  <option>RU</option>
                  <option>EN</option>
                </select>
              </li>
            </ul>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => router.push('/lobby')}
                    className="bg-cyber-yellow text-cyber-black border-none px-6 py-2.5 font-bold uppercase cursor-pointer transition-all text-sm tracking-wide hover:bg-cyber-yellow-dark hover:shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                  >
                    Лобби
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-transparent text-cyber-text border border-white/30 px-6 py-2.5 font-bold uppercase cursor-pointer transition-all text-sm tracking-wide hover:border-cyber-yellow hover:text-cyber-yellow"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="bg-cyber-yellow text-cyber-black border-none px-6 py-2.5 font-bold uppercase cursor-pointer transition-all text-sm tracking-wide hover:bg-cyber-yellow-dark hover:shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                  >
                    Регистрация
                  </button>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="bg-transparent text-cyber-text border border-white/30 px-6 py-2.5 font-bold uppercase cursor-pointer transition-all text-sm tracking-wide hover:border-cyber-yellow hover:text-cyber-yellow"
                  >
                    Вход
                  </button>
                </>
              )}
              <button
                className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                <span className={`w-6 h-0.5 bg-cyber-text transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-cyber-text transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-cyber-text transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </button>
            </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4">
              <ul className="flex flex-col items-center gap-4">
                <li><a href="#games" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm">ИГРЫ</a></li>
                <li><a href="#series" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm">СЕРИАЛЫ</a></li>
                <li><a href="#community" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm">СООБЩЕСТВО</a></li>
                <li><a href="#other" className="text-cyber-text hover:text-cyber-yellow transition-colors uppercase text-sm">ПРОЧЕЕ</a></li>
              </ul>
            </div>
          )}
        </nav>
      </header>
      {isAuthModalOpen && (
        <AuthModalContent
          mode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
    </>
  );
}

function AuthModalContent({ 
  mode, 
  onClose, 
  onSwitchMode 
}: { 
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-strong rounded-lg p-8 max-w-md w-full mx-4 border border-cyber-yellow/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-orbitron text-2xl font-black text-cyber-yellow uppercase tracking-wider">
            {mode === 'login' ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
          </h2>
          <button
            onClick={onClose}
            className="text-cyber-text-gray hover:text-cyber-yellow text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <AuthForm mode={mode} onClose={onClose} onSwitchMode={onSwitchMode} />
      </div>
    </div>
  );
}

function AuthForm({ 
  mode, 
  onClose, 
  onSwitchMode 
}: { 
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await createProfile(data.user.id, data.user.email || '');
          toast.success('Регистрация успешна!');
          onClose();
          router.push('/lobby');
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Вход выполнен!');
        onClose();
        router.push('/lobby');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'vk') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка авторизации');
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) throw error;

      if (data.user) {
        await createProfile(data.user.id, 'anonymous');
        toast.success('Анонимный вход выполнен!');
        onClose();
        router.push('/lobby');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка анонимного входа');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      <div>
        <label className="block text-cyber-text-gray text-sm mb-2 uppercase tracking-wide">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-cyber-gray border border-white/10 text-cyber-text px-4 py-3 rounded focus:outline-none focus:border-cyber-yellow focus:ring-1 focus:ring-cyber-yellow"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="block text-cyber-text-gray text-sm mb-2 uppercase tracking-wide">
          Пароль
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full bg-cyber-gray border border-white/10 text-cyber-text px-4 py-3 rounded focus:outline-none focus:border-cyber-yellow focus:ring-1 focus:ring-cyber-yellow"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyber-yellow text-cyber-black border-none py-3 font-bold uppercase cursor-pointer transition-all tracking-wide hover:bg-cyber-yellow-dark hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
      </button>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-transparent text-cyber-text-gray">ИЛИ</span>
        </div>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loading}
          className="w-full bg-cyber-gray border border-white/10 text-cyber-text py-3 font-bold uppercase cursor-pointer transition-all tracking-wide hover:border-cyber-yellow hover:text-cyber-yellow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Войти через Google
        </button>
        {/* VK может быть недоступен в некоторых регионах */}
        {/* <button
          type="button"
          onClick={() => handleOAuth('vk')}
          disabled={loading}
          className="w-full bg-cyber-gray border border-white/10 text-cyber-text py-3 font-bold uppercase cursor-pointer transition-all tracking-wide hover:border-cyber-yellow hover:text-cyber-yellow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Войти через VK
        </button> */}
        <button
          type="button"
          onClick={handleAnonymous}
          disabled={loading}
          className="w-full bg-cyber-neon-blue/20 border border-cyber-neon-blue/50 text-cyber-neon-blue py-3 font-bold uppercase cursor-pointer transition-all tracking-wide hover:bg-cyber-neon-blue/30 hover:border-cyber-neon-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⚡ Анонимный вход
        </button>
      </div>
      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => onSwitchMode(mode === 'login' ? 'register' : 'login')}
          className="text-cyber-text-gray hover:text-cyber-yellow text-sm transition-colors"
        >
          {mode === 'login' 
            ? 'Нет аккаунта? Зарегистрироваться' 
            : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </form>
  );
}


