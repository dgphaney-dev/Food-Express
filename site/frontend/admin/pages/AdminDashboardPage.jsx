import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Flame,
  ChefHat,
  CheckCircle2,
  Clock,
  ArrowRight,
  Utensils,
  Bike,
  PackageOpen,
  Award,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../../src/contexts/AuthContext';
import { formatPrice } from '../../src/utils/helpers';
import ScrollReveal from '../../src/components/ScrollReveal';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await adminApi.fetchMetrics();
      if (data && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMetrics();
    const interval = setInterval(loadMetrics, 15_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loadMetrics]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  const totalRevenue = metrics?.totalRevenue || 0;
  const averageTicket = metrics?.averageTicket || 0;
  const totalOrders = metrics?.totalOrders || 0;
  const activeOrders = metrics?.activeOrders || 0;
  const dineInCount = metrics?.dineInOrders || 0;
  const deliveryCount = metrics?.deliveryOrders || 0;
  const dineInPct = totalOrders > 0 ? Math.round((dineInCount / totalOrders) * 100) : 0;
  const deliveryPct = totalOrders > 0 ? 100 - dineInPct : 0;

  const statusCounts = metrics?.statusCounts || {
    RECEIVED: 0,
    PREPARING: 0,
    READY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  if (!isAuthenticated) return null;

  return (
    <AdminLayout
      title="Dashboard & Métricas"
      subtitle="Visão Executiva, Faturamento e Desempenho Operacional em Tempo Real"
      onRefresh={handleManualRefresh}
      refreshing={refreshing}
    >
      {/* ================= TOP KPIS ================= */}
      <ScrollReveal direction="up" duration={500}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {/* Card 1: Faturamento */}
          <div className="bg-[#12100d] border border-[#2d2520] p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-[#3d3128] transition-colors">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                Faturamento Entregue
              </span>
              <span className="text-3xl font-black text-amber-400 mt-1 block font-['Oswald',sans-serif] tracking-tight">
                {formatPrice(totalRevenue)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {metrics?.deliveredOrders || 0} pedidos finalizados
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#1c1714] border border-[#332921] flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>

          {/* Card 2: Ticket Médio */}
          <div className="bg-[#12100d] border border-[#2d2520] p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-[#3d3128] transition-colors">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                Ticket Médio
              </span>
              <span className="text-3xl font-black text-stone-200 mt-1 block font-['Oswald',sans-serif] tracking-tight">
                {formatPrice(averageTicket)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Por pedido concluído
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#1c1714] border border-[#332921] flex items-center justify-center text-stone-300 group-hover:scale-105 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Card 3: Pedidos Ativos na Cozinha */}
          <div className="bg-[#12100d] border border-[#2d2520] p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-[#3d3128] transition-colors">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                Ativos na Cozinha
              </span>
              <span className="text-3xl font-black text-amber-400 mt-1 block font-['Oswald',sans-serif] tracking-tight flex items-center gap-2">
                {activeOrders}
                {activeOrders > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {statusCounts.RECEIVED} novos • {statusCounts.PREPARING} no fogo • {statusCounts.READY} prontos
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#1c1714] border border-[#332921] flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Flame size={24} />
            </div>
          </div>

          {/* Card 4: Total de Pedidos */}
          <div className="bg-[#12100d] border border-[#2d2520] p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-[#3d3128] transition-colors">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                Total Registrado
              </span>
              <span className="text-3xl font-black text-stone-200 mt-1 block font-['Oswald',sans-serif] tracking-tight">
                {totalOrders}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {dineInCount} salão • {deliveryCount} delivery
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ================= PIPELINE DO KDS & CANAIS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
        {/* KDS Status Pipeline */}
        <div className="lg:col-span-2 bg-[#12100d] border border-[#2d2520] p-5 sm:p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black uppercase font-['Oswald',sans-serif] text-white tracking-wide">
                Pipeline de Produção da Cozinha (KDS)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fluxo linear de status em tempo real da esteira de pedidos
              </p>
            </div>
            <Link
              to="/admin/pedidos"
              className="text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider text-stone-300 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <span>Abrir KDS</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Recebido */}
            <div className="p-4 rounded-2xl bg-[#0c0a08] border border-[#2d2520] flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-xs font-bold uppercase font-['Oswald',sans-serif]">1. Recebido</span>
                <Clock size={16} className="text-stone-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white font-['Oswald',sans-serif]">
                  {statusCounts.RECEIVED}
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Aguardando início</p>
              </div>
            </div>

            {/* 2. Em Preparo */}
            <div className="p-4 rounded-2xl bg-[#0c0a08] border border-[#332921] flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-bold uppercase font-['Oswald',sans-serif]">2. No Fogo</span>
                <ChefHat size={16} className="text-amber-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white font-['Oswald',sans-serif]">
                  {statusCounts.PREPARING}
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Grelha & montagem</p>
              </div>
            </div>

            {/* 3. Pronto */}
            <div className="p-4 rounded-2xl bg-[#0c0a08] border border-[#232d23] flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-xs font-bold uppercase font-['Oswald',sans-serif]">3. Pronto</span>
                <CheckCircle2 size={16} className="text-emerald-400/80" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white font-['Oswald',sans-serif]">
                  {statusCounts.READY}
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Expedição / Balcão</p>
              </div>
            </div>

            {/* 4. Entregue */}
            <div className="p-4 rounded-2xl bg-[#0c0a08] border border-[#2d2520] flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-bold uppercase font-['Oswald',sans-serif]">4. Concluído</span>
                <Award size={16} className="text-stone-500" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white font-['Oswald',sans-serif]">
                  {statusCounts.DELIVERED}
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Servido ao cliente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Channels Breakdown (Salão x Delivery) */}
        <div className="bg-[#12100d] border border-[#2d2520] p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black uppercase font-['Oswald',sans-serif] text-white tracking-wide">
              Divisão por Canal
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Distribuição de pedidos entre Salão e Entrega
            </p>
          </div>

          <div className="my-6 space-y-4">
            {/* Visual Bar */}
            <div className="h-4 w-full bg-[#181411] rounded-full overflow-hidden flex p-0.5 gap-1 border border-[#26201b]">
              <div
                style={{ width: `${dineInPct}%` }}
                className="bg-amber-500/80 rounded-full transition-all duration-500"
                title={`Salão: ${dineInPct}%`}
              />
              <div
                style={{ width: `${deliveryPct}%` }}
                className="bg-stone-600 rounded-full transition-all duration-500"
                title={`Delivery: ${deliveryPct}%`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#0c0a08] border border-[#2d2520]">
                <div className="flex items-center gap-1.5 text-stone-300 text-xs font-bold uppercase font-['Oswald',sans-serif]">
                  <Utensils size={14} className="text-amber-500/80" />
                  <span>Salão (Mesas)</span>
                </div>
                <div className="text-xl font-black text-white font-['Oswald',sans-serif] mt-1">
                  {dineInCount} <span className="text-xs text-zinc-500 font-normal">({dineInPct}%)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0a08] border border-[#2d2520]">
                <div className="flex items-center gap-1.5 text-stone-300 text-xs font-bold uppercase font-['Oswald',sans-serif]">
                  <Bike size={14} className="text-stone-400" />
                  <span>Delivery</span>
                </div>
                <div className="text-xl font-black text-white font-['Oswald',sans-serif] mt-1">
                  {deliveryCount} <span className="text-xs text-zinc-500 font-normal">({deliveryPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#26201b] text-center">
            <span className="text-[11px] text-zinc-500">
              Atualização automática sincronizada com o SQLite
            </span>
          </div>
        </div>
      </div>

      {/* ================= TOP PRODUTOS & PEDIDOS RECENTES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Ranking */}
        <div className="bg-[#12100d] border border-[#2d2520] p-5 sm:p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              <h2 className="text-lg font-black uppercase font-['Oswald',sans-serif] text-white tracking-wide">
                Mais Vendidos da Brasa
              </h2>
            </div>
            <Link
              to="/admin/cardapio"
              className="text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider text-stone-300 hover:text-amber-400 flex items-center gap-1"
            >
              <span>Gerenciar</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {metrics?.topProducts && metrics.topProducts.length > 0 ? (
            <div className="space-y-2.5">
              {metrics.topProducts.map((prod, idx) => (
                <div
                  key={prod.name}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#0c0a08] border border-[#241e1a] hover:border-[#382f28] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black font-['Oswald',sans-serif] ${
                        idx === 0
                          ? 'bg-[#221b16] text-amber-400 border border-[#3d3128]'
                          : idx === 1
                          ? 'bg-zinc-800 text-stone-200'
                          : idx === 2
                          ? 'bg-zinc-800 text-stone-400'
                          : 'bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {prod.count} {prod.count === 1 ? 'unidade vendida' : 'unidades vendidas'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-amber-400 font-['Oswald',sans-serif]">
                    {formatPrice(prod.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhum produto registrado no faturamento ainda.
            </div>
          )}
        </div>

        {/* Recent Orders Feed */}
        <div className="bg-[#12100d] border border-[#2d2520] p-5 sm:p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase font-['Oswald',sans-serif] text-white tracking-wide">
              Últimos Pedidos Recebidos
            </h2>
            <Link
              to="/admin/pedidos"
              className="text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider text-stone-300 hover:text-amber-400 flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
            <div className="space-y-2.5">
              {metrics.recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#0c0a08] border border-[#241e1a] hover:border-[#382f28] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-['Oswald',sans-serif] font-black text-sm text-white">
                          #{ord.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase font-['Oswald',sans-serif] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                          {ord.orderType === 'DINE_IN' ? `Mesa ${ord.tableNumber}` : `Delivery`}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        {ord.items?.length || 0} itens • {ord.customerName || 'Cliente'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-amber-400 font-['Oswald',sans-serif] block">
                      {formatPrice(ord.totalAmount)}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider font-['Oswald',sans-serif] ${
                        ord.status === 'DELIVERED'
                          ? 'text-emerald-400'
                          : ord.status === 'READY'
                          ? 'text-emerald-400'
                          : ord.status === 'PREPARING'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhum pedido recente.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
