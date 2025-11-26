'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full bg-cyber-black z-50 border-b border-white/10">
      <nav className="py-4">
        <div className="container mx-auto px-5 flex justify-between items-center">
          <div className="font-orbitron font-black text-2xl text-cyber-yellow uppercase tracking-wider drop-shadow-[0_0_10px_rgba(255,215,0,1)]">
            БУНКЕР
          </div>
          <ul className="hidden md:flex list-none gap-8 items-center">
            <li>
              <Link href="#games" className="text-white hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">
                ИГРЫ
              </Link>
            </li>
            <li>
              <Link href="#series" className="text-white hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">
                СЕРИАЛЫ
              </Link>
            </li>
            <li>
              <Link href="#community" className="text-white hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">
                СООБЩЕСТВО
              </Link>
            </li>
            <li>
              <Link href="#other" className="text-white hover:text-cyber-yellow transition-colors uppercase text-sm font-medium tracking-wide relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyber-yellow after:transition-all hover:after:w-full">
                ПРОЧЕЕ
              </Link>
            </li>
            <li>
              <select className="bg-transparent border border-white/30 text-white px-2.5 py-1.5 text-sm uppercase cursor-pointer">
                <option>RU</option>
                <option>EN</option>
              </select>
            </li>
          </ul>
          <button className="hidden md:block bg-cyber-yellow text-cyber-black border-none px-6 py-2.5 font-bold uppercase cursor-pointer transition-all text-sm tracking-wide hover:bg-cyber-yellow-dark hover:shadow-[0_0_15px_rgba(255,215,0,1)]">
            Создать Лобби
          </button>
          <button
            className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden fixed top-[70px] left-0 w-full bg-cyber-black border-t border-white/10 py-8">
            <ul className="flex flex-col items-center gap-4">
              <li><Link href="#games" className="text-white uppercase">ИГРЫ</Link></li>
              <li><Link href="#series" className="text-white uppercase">СЕРИАЛЫ</Link></li>
              <li><Link href="#community" className="text-white uppercase">СООБЩЕСТВО</Link></li>
              <li><Link href="#other" className="text-white uppercase">ПРОЧЕЕ</Link></li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  )
}

