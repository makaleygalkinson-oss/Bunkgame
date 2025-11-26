export default function NewsSection() {
  const newsItems = [
    { icon: '🎮', text: 'CYBERPUNK ULTIMATE EDITION' },
    { icon: '⚡', text: 'НОВОЕ ОБНОВЛЕНИЕ' },
    { icon: '🔮', text: 'РАСШИРЕНИЕ' },
    { icon: '🌟', text: 'СОБЫТИЯ' },
  ];

  return (
    <section className="bg-cyber-black py-12 border-t border-white/10">
      <div className="news-header flex justify-between items-center px-8 pb-8 mb-8 border-b border-white/10">
        <div className="font-orbitron text-xs text-cyber-text-gray uppercase tracking-wider">
          /// NEWS.MODULE_HIGHLIGHT
        </div>
        <div className="font-orbitron text-sm text-cyber-text">
          {new Date().toLocaleDateString('ru-RU')}
        </div>
        <div className="font-orbitron text-xl text-cyber-yellow uppercase tracking-wider drop-shadow-[0_0_10px_#FFD700]">
          NEWS
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-8 px-8">
        <div className="bg-cyber-neon-red p-12 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shine_3s_infinite]"></div>
          <div className="font-orbitron font-black text-3xl text-cyber-black uppercase tracking-widest relative z-10">
            CYBERPUNK
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsItems.map((item, index) => (
            <div
              key={index}
              className="bg-cyber-gray border border-white/10 p-8 cursor-pointer transition-all relative overflow-hidden group hover:border-cyber-yellow hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-yellow/10 to-cyber-neon-pink/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-5xl mb-4 filter drop-shadow-[0_0_10px_#00FFFF] relative z-10">
                {item.icon}
              </div>
              <div className="font-orbitron text-sm text-cyber-text uppercase tracking-wide relative z-10">
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

