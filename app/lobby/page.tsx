import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';

export default async function LobbyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <>
      <Header user={user} />
      <main className="min-h-screen pt-20">
        <div className="container max-w-7xl mx-auto px-5 py-10">
          <div className="glass-strong rounded-lg p-8 border border-cyber-yellow/30">
            <h1 className="font-orbitron text-4xl font-black text-cyber-yellow mb-6 uppercase tracking-wider text-center">
              ЛОББИ
            </h1>
            <div className="space-y-4">
              <div className="glass rounded-lg p-6 border border-white/10">
                <h2 className="font-orbitron text-xl font-bold text-cyber-yellow mb-4 uppercase">
                  Добро пожаловать, {user.email || 'Игрок'}!
                </h2>
                <p className="text-cyber-text-gray mb-4">
                  Вы успешно авторизованы. Здесь будет функционал лобби для игры "Бункер".
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-cyber-text-gray">
                    <span className="text-cyber-yellow">ID пользователя:</span> {user.id}
                  </p>
                  {user.is_anonymous && (
                    <p className="text-sm text-cyber-neon-blue">
                      ⚡ Анонимный режим
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

