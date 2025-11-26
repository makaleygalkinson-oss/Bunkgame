import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import NewsSection from '@/components/NewsSection';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main>
        <Hero />
        <NewsSection />
      </main>
      <footer className="bg-cyber-black py-8 text-center border-t border-white/10 text-cyber-text-gray text-sm">
        <div className="container max-w-7xl mx-auto px-5">
          <p>&copy; 2025 CYBERPUNK. Все права защищены.</p>
        </div>
      </footer>
    </>
  );
}

