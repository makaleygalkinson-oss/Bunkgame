import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black">
      <div className="text-center">
        <h1 className="font-orbitron text-6xl font-black text-cyber-yellow mb-4 uppercase tracking-wider">
          404
        </h1>
        <p className="text-cyber-text-gray mb-8 text-xl">
          Страница не найдена
        </p>
        <Link
          href="/"
          className="bg-cyber-yellow text-cyber-black border-none px-8 py-3 font-bold uppercase cursor-pointer transition-all tracking-wide hover:bg-cyber-yellow-dark hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] inline-block"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

