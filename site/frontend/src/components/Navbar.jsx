import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  LogOut,
  ClipboardList,
  UtensilsCrossed,
  Search,
  X,
  Bike,
  Menu,
  Home,
  Utensils,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/helpers';

export default function Navbar({
  isAdmin = false,
  cartItemCount = 0,
  cartCount,
  onCartClick,
  onLogout,
  searchQuery = '',
  onSearchChange,
}) {
  const count = cartCount ?? cartItemCount;
  const location = useLocation();
  const { totalPrice } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navTabs = [
    {
      label: 'NOSSOS PRODUTOS',
      path: '/nossos-produtos',
      altPaths: ['/delivery', '/cardapio', '/produtos'],
      icon: Utensils,
    },
    {
      label: 'RESTAURANTE & SALÃO',
      path: '/restaurante',
      altPaths: ['/salao'],
      icon: UtensilsCrossed,
    },
    {
      label: 'TELA DO MOTORISTA',
      path: '/entregador',
      altPaths: ['/motorista', '/driver'],
      icon: Bike,
    },
    {
      label: 'ACESSO DO ATENDENTE',
      path: '/admin/login',
      altPaths: [],
      icon: ShieldCheck,
    },
  ];

  const isTabActive = (tab) => {
    if (location.pathname === tab.path) return true;
    if (tab.altPaths && tab.altPaths.includes(location.pathname)) return true;
    return false;
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md shadow-2xl w-full ${
        isAdmin
          ? 'bg-black/95 border-b border-zinc-800'
          : 'bg-[#0e0c0a]/95 border-b border-[#26201b]'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex h-18 items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to={isAdmin ? '/admin/pedidos' : '/'} className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black border-2 border-orange-500/50 text-white transition-transform group-hover:scale-105 overflow-hidden shadow-xl ring-2 ring-orange-500/20 shrink-0">
              <img src="/logo.jpg" alt="FoodExpress" className="w-full h-full object-cover scale-105" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none font-['Oswald',sans-serif]">
                Food<span className="bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 bg-clip-text text-transparent">Express</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-bold text-amber-500/90 tracking-widest uppercase mt-0.5 font-['Oswald',sans-serif]">
                {isAdmin ? 'Painel Operacional' : 'Steakhouse & Artisan Burgers'}
              </span>
            </div>
          </Link>
        </div>

        {/* Center Search Bar (Client View - when onSearchChange is passed on wide desktop) */}
        {!isAdmin && onSearchChange && (
          <div className="hidden 2xl:flex flex-1 max-w-xs mx-2">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="BUSCAR NO CARDÁPIO..."
                className="w-full rounded-full border border-[#2d2520] bg-[#161311] pl-9 pr-9 py-2 text-xs font-semibold text-stone-100 placeholder-stone-500 transition-colors focus:border-orange-500 focus:bg-[#1a1613] focus:outline-none uppercase font-['Oswald',sans-serif] tracking-wider"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-0.5 rounded-full"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Desktop Navigation Tabs (Aparece em telas a partir de xl para garantir zero aperto/quebra) */}
        {!isAdmin && (
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-2 shrink-0">
            {/* INÍCIO */}
            <Link
              to="/"
              className={`group relative px-2.5 2xl:px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-['Oswald',sans-serif] whitespace-nowrap shrink-0 transition-all duration-300 ${
                location.pathname === '/'
                  ? 'text-amber-400'
                  : 'text-stone-300 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span className="relative z-10 transition-transform duration-300 inline-block group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                INÍCIO
              </span>

              {/* Active / Hover Glowing Indicator Line */}
              <span
                className={`absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full transition-all duration-300 origin-center ${
                  location.pathname === '/'
                    ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 opacity-100 shadow-[0_0_10px_rgba(249,115,22,0.9)]'
                    : 'bg-gradient-to-r from-orange-500/20 via-amber-400 to-orange-500/20 opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100 group-hover:shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                }`}
              />

              {/* Ambient Ember Glow on Hover */}
              <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-orange-500/0 via-amber-500/[0.04] to-orange-500/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Link>

            {/* Abas Dinâmicas */}
            {navTabs.map((tab) => {
              const active = isTabActive(tab);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`group relative px-2.5 2xl:px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-['Oswald',sans-serif] whitespace-nowrap shrink-0 transition-all duration-300 ${
                    active
                      ? 'text-amber-400'
                      : 'text-stone-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="relative z-10 transition-transform duration-300 inline-block group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                    {tab.label}
                  </span>

                  {/* Active / Hover Glowing Indicator Line */}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full transition-all duration-300 origin-center ${
                      active
                        ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 opacity-100 shadow-[0_0_10px_rgba(249,115,22,0.9)]'
                        : 'bg-gradient-to-r from-orange-500/20 via-amber-400 to-orange-500/20 opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100 group-hover:shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                    }`}
                  />

                  {/* Ambient Ember Glow on Hover */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-orange-500/0 via-amber-500/[0.04] to-orange-500/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side actions (Sacola, Pedir Agora, Hambúrguer Responsivo) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {isAdmin ? (
            <>
              {/* Admin nav links */}
              <Link
                to="/admin/pedidos"
                className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/admin/pedidos') || isActive('/admin/orders')
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                title="Fila de Pedidos"
              >
                <ClipboardList size={15} />
                <span>Pedidos</span>
              </Link>

              <Link
                to="/admin/cardapio"
                className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/admin/cardapio') || isActive('/admin/menu')
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                title="Gerenciar Cardápio"
              >
                <UtensilsCrossed size={15} />
                <span>Cardápio</span>
              </Link>

              <Link
                to="/entregador"
                className={`hidden sm:flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/entregador') || isActive('/motorista')
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                title="Abrir tela do motorista/entregador"
              >
                <Bike size={15} />
                <span>Entregador</span>
              </Link>

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="ml-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] text-zinc-400 hover:bg-red-950/40 hover:text-red-400 border border-transparent hover:border-red-900/40 transition-colors cursor-pointer shrink-0"
                title="Sair do painel"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <>
              {/* Customer Cart button with live count and subtotal */}
              {onCartClick ? (
                <button
                  onClick={onCartClick}
                  className="relative flex items-center gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-full bg-[#181411] hover:bg-[#201b17] border border-[#3a3029] hover:border-[#4d3f35] text-white px-3 sm:px-5 py-2 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
                  aria-label={`Sacola com ${count} itens`}
                >
                  <ShoppingBag size={15} strokeWidth={2.2} className="text-amber-500 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-stone-100">Sacola</span>
                  {count > 0 ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 pl-1 border-l border-[#3a3029] ml-1">
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c2410c] px-1.5 text-xs font-bold text-white shadow-sm">
                        {count}
                      </span>
                      <span className="hidden sm:inline text-xs font-semibold text-amber-400">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-stone-500 font-normal hidden sm:inline">vazia</span>
                  )}
                </button>
              ) : (
                /* Botão Pedir Agora Responsivo (Sem truncar) */
                <Link
                  to="/nossos-produtos"
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#c2410c] hover:bg-[#d9531e] active:scale-95 text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold shadow-md shadow-black/50 uppercase font-['Oswald',sans-serif] tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShoppingBag size={14} className="shrink-0" />
                  <span>Pedir Agora</span>
                </Link>
              )}

              {/* Botão de Menu Hambúrguer Responsivo (Aparece em telas tablet/mobile < xl) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#181411] hover:bg-[#221c17] border border-[#3a3029] text-stone-200 hover:text-white transition-all cursor-pointer shrink-0"
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileMenuOpen ? <X size={20} className="text-orange-500" /> : <Menu size={20} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* DRAWER RESPONSIVO MOBILE & TABLET (Renderizado via Portal no body para garantir isolamento e z-index absoluto) */}
      {!isAdmin &&
        mobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="xl:hidden fixed inset-0 z-[99999] flex justify-end">
            {/* 1. Backdrop escurecedor profundo (Escurece 100% da tela de fundo com blur de brasa escura) */}
            <div
              className="fixed inset-0 transition-opacity duration-300 animate-in fade-in"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.96)', backdropFilter: 'blur(8px)' }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* 2. Painel do Menu (100% escuro sólido na paleta Steakhouse) */}
            <div
              className="w-full sm:w-[380px] sm:max-w-sm h-full border-l border-[#2e241d] p-5 sm:p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] relative z-10 animate-in slide-in-from-right duration-300 overflow-y-auto"
              style={{ backgroundColor: '#0a0807' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Topo do Drawer */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#221a14]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-black border-2 border-orange-500/50 flex items-center justify-center overflow-hidden shadow-lg">
                      <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover scale-105" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-white font-['Oswald',sans-serif] tracking-tight">
                        Food<span className="text-orange-500">Express</span>
                      </span>
                      <span className="text-[10px] text-amber-500 block uppercase font-bold tracking-wider font-['Oswald',sans-serif]">
                        Menu de Navegação
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-xl bg-[#14100d] border border-[#2e231b] text-stone-300 hover:text-white hover:border-orange-500/50 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Fechar menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Lista de Links no Drawer (Cada item com card escuro sólido e borda nítida) */}
                <nav className="mt-5 space-y-2">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ backgroundColor: location.pathname === '/' ? '#24170f' : '#14100d' }}
                    className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] transition-all shadow-sm ${
                      location.pathname === '/'
                        ? 'border border-orange-500/60 text-amber-400 ring-1 ring-orange-500/30'
                        : 'border border-[#241c16] text-stone-200 hover:text-white hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Home size={17} className={location.pathname === '/' ? 'text-amber-400' : 'text-stone-400'} />
                      <span className="text-sm">Início</span>
                    </div>
                    <ChevronRight size={15} className="opacity-60" />
                  </Link>

                  {navTabs.map((tab) => {
                    const active = isTabActive(tab);
                    const Icon = tab.icon;
                    return (
                      <Link
                        key={tab.path}
                        to={tab.path}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ backgroundColor: active ? '#24170f' : '#14100d' }}
                        className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] transition-all shadow-sm ${
                          active
                            ? 'border border-orange-500/60 text-amber-400 ring-1 ring-orange-500/30'
                            : 'border border-[#241c16] text-stone-200 hover:text-white hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={17} className={active ? 'text-amber-400' : 'text-stone-400'} />
                          <span className="text-sm">{tab.label}</span>
                        </div>
                        <ChevronRight size={15} className="opacity-60" />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Rodapé do Drawer com Ações Rápidas */}
              <div className="pt-5 border-t border-[#221a14] space-y-3 mt-6">
                <Link
                  to="/nossos-produtos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider font-['Oswald',sans-serif] flex items-center justify-center gap-2 shadow-xl shadow-orange-950/70 transition-all cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>Pedir no Cardápio</span>
                </Link>

                <div className="text-center text-[11px] text-stone-400 font-medium tracking-wide">
                  FoodExpress Steakhouse · Salão & Delivery
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
