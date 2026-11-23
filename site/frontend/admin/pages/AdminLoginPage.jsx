import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../src/contexts/AuthContext';
import { adminApi } from '../services/adminApi';
import ScrollReveal from '../../src/components/ScrollReveal';

export default function AdminLoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminApi.login(username.trim(), password);
      login(data.token, data.user || { username: username.trim() });
      navigate('/admin/pedidos', { replace: true });
    } catch (err) {
      if (err.status === 401 || err.status === 400) {
        setError(err.message || 'Usuário ou senha incorretos.');
      } else {
        setError('Não foi possível conectar ao servidor de autenticação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-['Plus_Jakarta_Sans',sans-serif] antialiased flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      {/* 1. DEDICATED ADMIN PORTAL HEADER */}
      <header className="sticky top-0 z-50 bg-[#0b0908]/95 backdrop-blur-md border-b border-[#26201b] shadow-xl w-full">
        <div className="max-w-7xl mx-auto w-full flex h-18 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black border border-[#3d3128] text-white overflow-hidden shadow-xl ring-1 ring-[#26201b] shrink-0">
              <img src="/logo.jpg" alt="FoodExpress" className="w-full h-full object-cover scale-105" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none font-['Oswald',sans-serif]">
                Food<span className="text-amber-500">Express</span>
              </span>
              <span className="text-[10px] font-bold text-stone-400 tracking-widest uppercase mt-0.5 font-['Oswald',sans-serif]">
                Portal Administrativo &amp; KDS
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14110e] border border-[#2d2520] text-[11px] font-bold text-stone-300 uppercase tracking-wider font-['Oswald',sans-serif]">
            <ShieldCheck size={14} className="text-amber-400" />
            <span>Acesso Exclusivo via URL</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN LOGIN AREA */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-black">
        {/* Dual-Panel Professional Login Container */}
        <ScrollReveal direction="zoom" duration={700} className="w-full max-w-5xl">
          <div className="relative z-10 w-full rounded-3xl border border-zinc-800 bg-[#121214] shadow-2xl shadow-black overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-all">
            
            {/* Left Column: Form Panel (Painel do Atendente) */}
            <div className="p-6 sm:p-8 lg:p-10 md:col-span-7 flex flex-col justify-between">
              <div>
                {/* Top Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/80 text-[11px] font-bold text-orange-500 uppercase tracking-wider font-['Oswald',sans-serif]">
                    <ShieldCheck size={14} className="text-orange-500" />
                    ACESSO RESTRITO AO STAFF
                  </span>
                </div>

                {/* Heading */}
                <div className="space-y-1.5 mb-6 text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-tight">
                    PAINEL DO ATENDENTE
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                    Digite suas credenciais corporativas para acessar o painel de pedidos e cozinha.
                  </p>
                </div>

                {isAuthenticated && (
                  <div className="mb-4 p-3 rounded-xl bg-[#1c1714] border border-[#3d3128] flex items-center justify-between gap-3 text-xs">
                    <span className="text-amber-300 font-medium">Você já possui uma sessão ativa iniciada.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/pedidos')}
                      className="px-3 py-1 rounded-lg bg-[#251e18] hover:bg-[#30261f] text-amber-400 border border-[#423429] font-bold uppercase tracking-wider text-[11px] font-['Oswald',sans-serif] shrink-0 cursor-pointer"
                    >
                      Ir para Pedidos →
                    </button>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username Field */}
                  <div className="text-left">
                    <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 font-['Oswald',sans-serif] mb-1.5">
                      USUÁRIO OPERACIONAL
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: admin"
                        required
                        autoComplete="username"
                        className="w-full h-12 pl-10 pr-4 border border-[#2d2520] bg-[#12100e] focus:bg-[#161310] focus:border-amber-500/50 rounded-xl text-white placeholder-zinc-600 text-sm font-medium transition-colors outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="text-left">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 font-['Oswald',sans-serif] mb-1.5">
                      SENHA DE ACESSO
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        required
                        autoComplete="current-password"
                        className="w-full h-12 pl-10 pr-11 border border-[#2d2520] bg-[#12100e] focus:bg-[#161310] focus:border-amber-500/50 rounded-xl text-white placeholder-zinc-600 text-sm font-medium transition-colors outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs font-medium text-center">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 bg-[#1c1714] hover:bg-[#261f1a] active:scale-[0.99] text-amber-400 hover:text-amber-300 border border-[#3d3128] hover:border-[#524135] font-bold text-sm uppercase tracking-wider font-['Oswald',sans-serif] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>ENTRAR NO PAINEL</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Bottom Security Note */}
              <div className="mt-8 pt-5 border-t border-zinc-800/80 flex items-center justify-between gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <ShieldCheck size={14} className="text-orange-500" />
                  Sessão segura de atendimento (Token JWT + Hash scrypt)
                </span>

                <span className="text-[11px] font-semibold text-zinc-500 uppercase font-['Oswald',sans-serif] tracking-wider">
                  Uso Interno
                </span>
              </div>
            </div>

            {/* Right Column: Visual Burger Atmosphere & Professional Information Showcase */}
            <div className="relative md:col-span-5 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[380px] md:min-h-full">
              {/* Background Burger Image with Controlled Opacity & Realistic Colors */}
              <img
                src="/login-burger.jpg"
                alt="FoodExpress Artisan Burger"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-45 scale-105 pointer-events-none select-none"
              />
              {/* Dark Charcoal / Black Vignette Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/65 to-black/40 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121214]/70 via-transparent to-black/30 pointer-events-none" />

              {/* Top Showcase Header */}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-[10px] font-bold text-orange-500 uppercase tracking-wider font-['Oswald',sans-serif]">
                  <Flame size={12} className="text-orange-500" />
                  SISTEMA OPERACIONAL
                </span>
                <span className="text-[11px] font-semibold text-zinc-400 tracking-wide">
                  FoodExpress v2.0
                </span>
              </div>

              {/* Middle Feature Highlights */}
              <div className="relative z-10 my-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-tight leading-tight">
                    Gestão em Tempo Real
                  </h2>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Controle integrado de salão, fila de cozinha e entregas com atualização contínua e sincronização ágil.
                  </p>
                </div>

                {/* Status Points with Badges */}
                <div className="pt-3 space-y-2.5 border-t border-zinc-800/80 text-xs text-zinc-200">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-orange-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">Fila de pedidos com máquina de estados</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-orange-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">Gestão dinâmica de itens, adicionais e estoque</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-orange-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">Sincronização instantânea com salão e delivery</span>
                  </div>
                </div>
              </div>

              {/* Bottom Metrics Pill */}
              <div className="relative z-10 p-3 rounded-xl bg-zinc-900/85 backdrop-blur-xs border border-zinc-800 flex items-center justify-between text-left">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 font-['Oswald',sans-serif] tracking-wider">
                    Operação Integrada
                  </span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Sparkles size={13} className="text-amber-400" />
                    Salão, Cozinha e Delivery sincronizados
                  </span>
                </div>
                <span className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] font-bold text-emerald-400 font-['Oswald',sans-serif]">
                  PRODUÇÃO
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
