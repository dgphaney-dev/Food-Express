import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Utensils,
  Bike,
  Award,
  RefreshCw,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Receipt,
  Percent,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/adminApi';
import { formatPrice } from '../../src/utils/helpers';
import ScrollReveal from '../../src/components/ScrollReveal';

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('today'); // 'today' | '7days' | 'month'

  const loadMetrics = useCallback(async () => {
    try {
      const data = await adminApi.fetchMetrics();
      if (data && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch {
      // Ignora falha de rede
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 20_000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  const totalRevenue = metrics?.totalRevenue || 0;
  const averageTicket = metrics?.averageTicket || 0;
  const totalOrders = metrics?.totalOrders || 0;
  const deliveredOrders = metrics?.deliveredOrders || 0;
  const activeOrders = metrics?.activeOrders || 0;
  const cancelledOrders = metrics?.cancelledOrders || 0;
  const dineInCount = metrics?.dineInOrders || 0;
  const deliveryCount = metrics?.deliveryOrders || 0;

  const completionRate =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 100;
  const dineInPct =
    totalOrders > 0 ? Math.round((dineInCount / totalOrders) * 100) : 50;
  const deliveryPct = 100 - dineInPct;

  const statusCounts = metrics?.statusCounts || {
    RECEIVED: 0,
    PREPARING: 0,
    READY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  return (
    <AdminLayout
      title="Métricas & Desempenho"
      subtitle="Relatório financeiro, volume de pedidos e taxa operacional do restaurante"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="w-full space-y-6">
        {/* ================= CONTROLE DE PERÍODO & CABEÇALHO LIMPO ================= */}
        <ScrollReveal direction="up" duration={500}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12100d] border border-[#26201b]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1c1714] border border-[#332a24] flex items-center justify-center text-amber-400">
                <Receipt size={17} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-200 font-['Oswald',sans-serif] block">
                  Demonstrativo de Vendas & Faturamento
                </span>
                <span className="text-[11px] text-stone-500">
                  Dados sincronizados em tempo real com o banco de dados SQLite
                </span>
              </div>
            </div>

            {/* Time Filter Pills - Cores sóbrias e elegantes */}
            <div className="flex items-center gap-1 bg-[#0b0908] p-1 rounded-xl border border-[#26201b] self-start sm:self-auto">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer ${
                  timeFilter === 'today'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Hoje (Tempo Real)
              </button>
              <button
                onClick={() => setTimeFilter('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer ${
                  timeFilter === '7days'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer ${
                  timeFilter === 'month'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Este Mês
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* ================= 4 CARDS PRINCIPAIS MONOCROMÁTICOS E ELEGANTES ================= */}
        <ScrollReveal direction="up" delay={50} duration={600}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Faturamento */}
            <div className="p-5 rounded-2xl bg-[#12100d] border border-[#26201b] hover:border-[#3d322a] transition-all">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Faturamento Entregue
                </span>
                <span className="text-amber-500/80">
                  <DollarSign size={16} />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-stone-100 font-['Oswald',sans-serif] tracking-tight">
                  {formatPrice(totalRevenue)}
                </span>
                <p className="text-[10px] text-stone-500 mt-1 font-medium">
                  {deliveredOrders} pedidos pagos e servidos
                </p>
              </div>
            </div>

            {/* Card 2: Ticket Médio */}
            <div className="p-5 rounded-2xl bg-[#12100d] border border-[#26201b] hover:border-[#3d322a] transition-all">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Ticket Médio
                </span>
                <span className="text-stone-400">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-stone-100 font-['Oswald',sans-serif] tracking-tight">
                  {formatPrice(averageTicket)}
                </span>
                <p className="text-[10px] text-stone-500 mt-1 font-medium">
                  Média por pedido concluído
                </p>
              </div>
            </div>

            {/* Card 3: Volume & Taxa de Conclusão */}
            <div className="p-5 rounded-2xl bg-[#12100d] border border-[#26201b] hover:border-[#3d322a] transition-all">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Volume Total
                </span>
                <span className="text-stone-400">
                  <ShoppingBag size={16} />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-stone-100 font-['Oswald',sans-serif] tracking-tight">
                  {totalOrders} <span className="text-sm font-normal text-stone-500">pedidos</span>
                </span>
                <p className="text-[10px] text-stone-500 mt-1 font-medium">
                  Taxa de conclusão: <span className="text-amber-400 font-bold">{completionRate}%</span>
                </p>
              </div>
            </div>

            {/* Card 4: Em Andamento na Cozinha */}
            <div className="p-5 rounded-2xl bg-[#12100d] border border-[#26201b] hover:border-[#3d322a] transition-all">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Em Produção
                </span>
                <span className="text-amber-500/80">
                  <Clock size={16} />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-['Oswald',sans-serif] tracking-tight">
                  {activeOrders} <span className="text-sm font-normal text-stone-500">ativos</span>
                </span>
                <p className="text-[10px] text-stone-500 mt-1 font-medium">
                  {statusCounts.RECEIVED} aguardando • {statusCounts.PREPARING} no fogo • {statusCounts.READY} prontos
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ================= 2 COLUNAS: RANKING DE PRODUTOS + CANAIS DE VENDA ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Produtos Mais Vendidos (Monocromático Refinado) */}
          <ScrollReveal direction="up" delay={80} duration={600}>
            <div className="p-6 rounded-2xl bg-[#12100d] border border-[#26201b] h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#26201b] mb-4">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-amber-400" />
                    <h2 className="text-base font-bold uppercase font-['Oswald',sans-serif] text-stone-100 tracking-wide">
                      Ranking dos Mais Vendidos
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase font-['Oswald',sans-serif]">
                    Por Unidades
                  </span>
                </div>

                {metrics?.topProducts && metrics.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topProducts.map((prod, idx) => {
                      const maxUnits = metrics.topProducts[0]?.count || 1;
                      const barWidth = Math.round((prod.count / maxUnits) * 100);

                      return (
                        <div
                          key={prod.name}
                          className="p-3 rounded-xl bg-[#0b0908] border border-[#1f1a16] hover:border-[#332a24] transition-all"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1a1512] border border-[#2e2520] text-stone-300 font-bold text-xs font-['Oswald',sans-serif]">
                                {idx + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-stone-100">
                                {prod.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-amber-400 font-['Oswald',sans-serif] block">
                                {formatPrice(prod.revenue)}
                              </span>
                              <span className="text-[10px] text-stone-500 block">
                                {prod.count} {prod.count === 1 ? 'unidade' : 'unidades'}
                              </span>
                            </div>
                          </div>

                          {/* Barra de Proporção Sóbria */}
                          <div className="h-1.5 w-full bg-[#171310] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${barWidth}%` }}
                              className="h-full bg-gradient-to-r from-stone-600 to-amber-500/70 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-stone-500">
                    Nenhuma venda registrada até o momento.
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#1f1a16] flex items-center justify-between text-[11px] text-stone-500">
                <span>Total itens catalogados:</span>
                <span className="font-bold text-stone-300">
                  {metrics?.topProducts?.reduce((sum, p) => sum + p.count, 0) || 0} vendidos
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Coluna 2: Divisão por Canal & Métodos de Atendimento */}
          <ScrollReveal direction="up" delay={100} duration={600}>
            <div className="p-6 rounded-2xl bg-[#12100d] border border-[#26201b] h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#26201b] mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-amber-400" />
                    <h2 className="text-base font-bold uppercase font-['Oswald',sans-serif] text-stone-100 tracking-wide">
                      Canais de Atendimento
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase font-['Oswald',sans-serif]">
                    Salão vs Delivery
                  </span>
                </div>

                {/* Barra de Distribuição Elegante em 2 Tons Neutros */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs font-bold uppercase font-['Oswald',sans-serif] text-stone-300 mb-2">
                    <span>Salão ({dineInPct}%)</span>
                    <span>Delivery ({deliveryPct}%)</span>
                  </div>
                  <div className="h-3 w-full bg-[#0b0908] rounded-full overflow-hidden p-0.5 border border-[#26201b] flex gap-1">
                    <div
                      style={{ width: `${dineInPct}%` }}
                      className="h-full bg-amber-500/80 rounded-full transition-all duration-500"
                      title={`Salão: ${dineInPct}%`}
                    />
                    <div
                      style={{ width: `${deliveryPct}%` }}
                      className="h-full bg-stone-600 rounded-full transition-all duration-500"
                      title={`Delivery: ${deliveryPct}%`}
                    />
                  </div>
                </div>

                {/* Cards Comparativos Monocromáticos */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-4 rounded-xl bg-[#0b0908] border border-[#1f1a16]">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase font-['Oswald',sans-serif]">
                      <Utensils size={14} />
                      <span>Mesas / Salão</span>
                    </div>
                    <div className="text-xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1.5">
                      {dineInCount}{' '}
                      <span className="text-xs text-stone-500 font-normal">
                        ({dineInPct}%)
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Consumo presencial
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0908] border border-[#1f1a16]">
                    <div className="flex items-center gap-1.5 text-stone-300 text-xs font-bold uppercase font-['Oswald',sans-serif]">
                      <Bike size={14} />
                      <span>Delivery</span>
                    </div>
                    <div className="text-xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1.5">
                      {deliveryCount}{' '}
                      <span className="text-xs text-stone-500 font-normal">
                        ({deliveryPct}%)
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Viagem & Entregadores
                    </p>
                  </div>
                </div>

                {/* Indicadores de Pagamento */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-['Oswald',sans-serif] block mb-1">
                    Métodos de Pagamento Registrados:
                  </span>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0908] border border-[#1f1a16] text-xs">
                    <span className="text-stone-300 font-medium">PIX / Dinheiro</span>
                    <span className="font-bold text-stone-100 font-['Oswald',sans-serif]">
                      100% liquidados
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#1f1a16] flex items-center justify-between text-[11px] text-stone-500">
                <span>Taxa de cancelamento:</span>
                <span className="font-bold text-stone-300">
                  {totalOrders > 0
                    ? Math.round((cancelledOrders / totalOrders) * 100)
                    : 0}
                  % ({cancelledOrders} cancelados)
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ================= ESTEIRA OPERACIONAL RESUMIDA ================= */}
        <ScrollReveal direction="up" delay={120} duration={600}>
          <div className="p-6 rounded-2xl bg-[#12100d] border border-[#26201b]">
            <div className="flex items-center justify-between pb-3 border-b border-[#26201b] mb-4">
              <h2 className="text-base font-bold uppercase font-['Oswald',sans-serif] text-stone-100 tracking-wide">
                Resumo da Fila Operacional
              </h2>
              <span className="text-[10px] font-bold text-stone-500 uppercase font-['Oswald',sans-serif]">
                Status Linear da Cozinha
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0b0908] border border-[#221c18]">
                <span className="text-[11px] font-bold uppercase text-stone-400 font-['Oswald',sans-serif] block">
                  1. Recebidos
                </span>
                <span className="text-xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1 block">
                  {statusCounts.RECEIVED}
                </span>
                <span className="text-[10px] text-stone-500">Aguardando</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0b0908] border border-[#221c18]">
                <span className="text-[11px] font-bold uppercase text-amber-400 font-['Oswald',sans-serif] block">
                  2. No Fogo
                </span>
                <span className="text-xl font-black text-amber-400 font-['Oswald',sans-serif] mt-1 block">
                  {statusCounts.PREPARING}
                </span>
                <span className="text-[10px] text-stone-500">Em preparo</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0b0908] border border-[#221c18]">
                <span className="text-[11px] font-bold uppercase text-stone-200 font-['Oswald',sans-serif] block">
                  3. Prontos
                </span>
                <span className="text-xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1 block">
                  {statusCounts.READY}
                </span>
                <span className="text-[10px] text-stone-500">Expedição</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0b0908] border border-[#221c18]">
                <span className="text-[11px] font-bold uppercase text-stone-200 font-['Oswald',sans-serif] block">
                  4. Concluídos
                </span>
                <span className="text-xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1 block">
                  {statusCounts.DELIVERED}
                </span>
                <span className="text-[10px] text-stone-500">Entregues</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0b0908] border border-[#221c18] col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase text-stone-500 font-['Oswald',sans-serif] block">
                  5. Cancelados
                </span>
                <span className="text-xl font-black text-stone-400 font-['Oswald',sans-serif] mt-1 block">
                  {statusCounts.CANCELLED}
                </span>
                <span className="text-[10px] text-stone-600">Encerrados</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </AdminLayout>
  );
}
