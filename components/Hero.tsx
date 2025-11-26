'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export default function Hero() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <section className="mt-20 min-h-[calc(100vh-70px)] flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] w-full min-h-[calc(100vh-70px)]">
        <div className="bg-cyber-yellow text-cyber-black flex flex-col justify-center items-center p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)] pointer-events-none"></div>
          <h1 className="font-orbitron font-black text-5xl lg:text-7xl text-center mb-12 leading-tight uppercase tracking-wider relative z-10">
            ПОЛНОЕ ПОГРУЖЕНИЕ В<br />CYBERPUNK 2077
          </h1>
          <div className="flex flex-col lg:flex-row gap-8 mb-12 relative z-10">
            <button
              onClick={() => router.push('/lobby')}
              className="bg-transparent text-cyber-black border-4 border-cyber-black px-10 py-4 font-bold uppercase cursor-pointer transition-all text-base tracking-wider font-orbitron hover:bg-cyber-black hover:text-cyber-yellow hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
            >
              Создать Лобби
            </button>
            <button
              onClick={() => router.push('/lobby')}
              className="bg-transparent text-cyber-black border-4 border-cyber-black px-10 py-4 font-bold uppercase cursor-pointer transition-all text-base tracking-wider font-orbitron hover:bg-cyber-black hover:text-cyber-yellow hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
            >
              Присоединиться к лобби
            </button>
          </div>
          <div className="flex flex-wrap gap-6 justify-center relative z-10">
            {['Xbox Series X|S', 'PS5', 'PC', 'Nintendo Switch', 'MAC'].map((platform) => (
              <div
                key={platform}
                className="px-5 py-2.5 bg-black/10 border-2 border-cyber-black font-semibold text-sm uppercase tracking-wide"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-cyber-dark relative overflow-hidden flex items-center justify-center">
          <div className="w-full h-full relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-[gridMove_20s_linear_infinite]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,0,64,0.1)_50%,transparent_100%),linear-gradient(0deg,transparent_0%,rgba(0,255,255,0.1)_50%,transparent_100%)] animate-[glitch_3s_infinite] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="text-8xl filter drop-shadow-[0_0_20px_#00FFFF] animate-[pulse_2s_ease-in-out_infinite]">
                👤
              </div>
              <div className="flex flex-col gap-4 w-48">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1 bg-gradient-to-r from-transparent via-cyber-neon-pink via-cyber-neon-blue via-cyber-neon-pink to-transparent shadow-[0_0_10px_#FF00FF] animate-[lineFlow_2s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

