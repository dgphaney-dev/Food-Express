import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Bike,
  Store,
  LogOut,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  Timer,
  ShieldCheck,
  Flame,
  Users,
} from 'lucide-react';
import { useAuth } from '../../src/contexts/AuthContext';
import { useOrders } from '../../src/contexts/OrderContext';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundAlert';

const SIDEBAR_COLLAPSED_KEY = 'foodexpress_admin_sidebar_collapsed';

export default function AdminLayout({
  children,
  title = 'Painel Administrativo',
  subtitle = 'Gestão Operacional de Salão e Delivery',
  onRefresh = null,
  refreshing = false,
  pollMs = 300_000,
  onPollChange = null,
  pollOptions = [],
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { adminOrders } = useOrders();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    } catch {
      // Ignore storage errors
    }
  }, [isCollapsed]);

  // Trava scroll da página enquanto o menu mobile do admin estiver aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [mobileMenuOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const activeOrdersCount = (adminOrders || []).filter((o) =>
    ['RECEIVED', 'PREPARING', 'READY'].includes(o.status)
  ).length;

  const navItems = [
    {
      to: '/admin/pedidos',
      altPaths: ['/admin/orders'],
      label: 'Fila de Pedidos & KDS',
      shortLabel: 'Pedidos',
      icon: ClipboardList,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
      badgeColor: 'bg-[#221b16] text-amber-400 border border-[#3a2f26]',
    },
    {
      to: '/admin/metricas',
      altPaths: ['/admin/dashboard', '/admin'],
      label: 'Métricas & Relatórios',
      shortLabel: 'Métricas',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/admin/cardapio',
      altPaths: ['/admin/menu'],
      label: 'Gestão de Cardápio',
      shortLabel: 'Cardápio',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      to: '/admin/banners',
      altPaths: ['/admin/slides', '/admin/destaques'],
      label: 'Banners do Hero',
      shortLabel: 'Banners',
      icon: Flame,
      badge: null,
    },
    {
      to: '/admin/usuarios',
      altPaths: ['/admin/users', '/admin/acessos', '/admin/equipe'],
      label: 'Equipe & Acessos',
      shortLabel: 'Usuários',
      icon: Users,
      badge: null,
    },
    {
      to: '/entregador',
      altPaths: ['/motorista'],
      label: 'Tela do Motorista',
      shortLabel: 'Entregador',
      icon: Bike,
      badge: null,
    },
  ];

  const isCurrentActive = (item) => {
    if (location.pathname === item.to) return true;
    if (item.altPaths && item.altPaths.includes(location.pathname)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#090807] text-zinc-100 flex overflow-x-clip font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* ================= MOBILE BACKDROP ================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0e0c0a] border-r border-[#26201b] transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen ${
          mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between px-4 border-b border-[#26201b]">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black border border-[#332921] text-white shrink-0 shadow-lg ring-1 ring-[#26201b] group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover scale-105" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-lg font-black tracking-tight text-white leading-none font-['Oswald',sans-serif]">
                  Food<span className="text-amber-500">Express</span>
                </span>
                <span className="text-[10px] font-bold text-stone-400 tracking-widest uppercase mt-0.5 font-['Oswald',sans-serif]">
                  Painel Operacional
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`relative flex items-center gap-3.5 px-3 py-3 rounded-xl font-bold uppercase tracking-wider text-xs font-['Oswald',sans-serif] transition-all duration-200 group ${
                  active
                    ? 'bg-[#1a1613] text-amber-400 border border-[#3a2f26] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#181411]'
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-amber-400' : 'text-zinc-400 group-hover:text-amber-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {item.badge !== null && (
                  <span
                    className={`ml-auto flex items-center justify-center font-black rounded-full px-2 py-0.5 text-[10px] shadow-sm ${
                      item.badgeColor || 'bg-[#221b16] text-amber-400 border border-[#3a2f26]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 my-2 border-t border-[#26201b]" />

          {/* Customer Menu Link */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir Cardápio Público do Cliente"
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] text-zinc-400 hover:text-amber-400 hover:bg-[#181411] transition-all"
          >
            <Store size={18} className="shrink-0 text-amber-500/80" />
            {!isCollapsed && <span className="truncate">Ver Cardápio Público ↗</span>}
          </Link>
        </nav>

        {/* Sidebar Footer / User Profile & Collapse Toggle */}
        <div className="p-3 border-t border-[#26201b] space-y-2">
          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#14110e] border border-[#2d2520]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1c1714] text-stone-300 font-black text-sm shrink-0 border border-[#332921]">
              <ShieldCheck size={18} className="text-amber-400" />
            </div>
            {!isCollapsed && (
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-white uppercase font-['Oswald',sans-serif] leading-tight">
                  Atendente / Admin
                </p>
                <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
                  Sessão Ativa
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Sair do painel"
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-[#181411] transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* ================= MAIN WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between px-4 sm:px-6 bg-[#0e0c0a]/95 backdrop-blur-md border-b border-[#26201b] shadow-xl">
          {/* Left: Mobile trigger & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl bg-[#181411] border border-[#2d2520]"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black uppercase font-['Oswald',sans-serif] text-white tracking-tight truncate">
                {title}
              </h1>
              <p className="hidden sm:block text-[11px] text-zinc-400 truncate">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Actions, Sound Toggle, Simulations & Refresh */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Status SQLite */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14110e] border border-[#2d2520] text-[10px] font-bold text-stone-300 uppercase font-['Oswald',sans-serif] tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse" />
              <span>API SQLite</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                soundActive
                  ? 'bg-[#181411] border-[#3a2f26] text-amber-400 hover:bg-[#201a15] shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title={soundActive ? 'Som de novo pedido ATIVO (clique para silenciar)' : 'Som SILENCIADO (clique para ativar)'}
            >
              {soundActive ? <Bell size={16} className="text-amber-400" /> : <BellOff size={16} />}
              <span className="hidden xl:inline text-[11px] uppercase font-['Oswald',sans-serif]">
                {soundActive ? 'Som: On' : 'Mudo'}
              </span>
            </button>

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#161310] hover:bg-[#221c17] border border-[#2d2520] hover:border-[#3d3128] text-stone-300 text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all active:scale-95 shadow-sm"
                title="Atualizar dados agora"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin text-amber-400' : 'text-stone-400'} />
                <span className="hidden md:inline">Atualizar</span>
              </button>
            )}

            {/* Poll interval */}
            {onPollChange && pollOptions.length > 0 && (
              <div className="hidden xl:flex items-center gap-1.5 bg-[#161310] border border-[#2d2520] rounded-xl px-2.5 py-1.5 shadow-sm">
                <Timer size={14} className="text-stone-400" />
                <select
                  value={pollMs}
                  onChange={onPollChange}
                  className="text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider bg-transparent border-none focus:outline-none text-stone-300 cursor-pointer"
                >
                  {pollOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-200">
                      Auto: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
