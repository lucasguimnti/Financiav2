'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Target, 
  CreditCard, 
  LogOut, 
  Menu, 
  X,
  Wallet,
  Repeat, 
  PieChart 
} from 'lucide-react';


export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Se estiver na tela de login, não mostra a Navbar
  if (pathname === '/login') return null;

  // Nossa lista de navegação atualizada
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Movimentações', path: '/lancamentos', icon: ArrowRightLeft },
    { name: 'Metas', path: '/metas', icon: Target },
    { name: 'Cartões', path: '/cartoes', icon: CreditCard },
    { name: 'Assinaturas', path: '/assinaturas', icon: Repeat },
    { name: 'Analytics', path: '/relatorios', icon: PieChart },
  ];

  return (
    <>
      {/* ESPAÇAMENTO PARA NÃO ESCONDER O CONTEÚDO */}
      <div className="h-20"></div>

      <nav className="fixed top-0 left-0 w-full z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* LOGO */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/dashboard'}>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Wallet className="text-slate-900" size={24} />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Fin<span className="text-emerald-400">App</span>
              </span>
            </div>

            {/* MENU DESKTOP */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.name} 
                    href={item.path}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-slate-800 text-white shadow-inner' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-emerald-400' : ''} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* BOTÃO SAIR (DESKTOP) */}
            <div className="hidden lg:flex items-center">
              <button 
                onClick={() => {
                  localStorage.removeItem('token'); 
                  window.location.href = '/login';
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut size={18} /> Sair
              </button>
            </div>

            {/* BOTÃO MENU MOBILE */}
            <div className="lg:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-400 hover:text-white p-2"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* MENU MOBILE (DROPDOWN) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 animate-in slide-in-from-top-2">
            <div className="px-4 pt-2 pb-6 space-y-2 shadow-2xl">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-base font-bold transition-all ${
                      isActive 
                        ? 'bg-slate-800 text-white border border-slate-700' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? 'text-emerald-400' : ''} />
                    {item.name}
                  </Link>
                );
              })}
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-base font-bold text-red-400 hover:bg-red-500/10 transition-all mt-4 border border-red-500/20"
              >
                <LogOut size={20} /> Sair da Conta
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}