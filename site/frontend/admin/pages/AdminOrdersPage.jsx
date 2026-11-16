import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  PackageOpen,
  RefreshCw,
  Timer,
  X,
  Utensils,
  Bike,
  Navigation,
  MapPin,
  Flame,
  ChefHat,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Search,
  Printer,
  MessageCircle,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../src/contexts/AuthContext';
import { useOrders } from '../../src/contexts/OrderContext';
import { adminApi } from '../services/adminApi';
import { ORDER_STATUS_SEQUENCE } from '../../src/data/mockData';
import { formatPrice, formatRelativeTime } from '../../src/utils/helpers';
import Navbar from '../../src/components/Navbar';
import ScrollReveal from '../../src/components/ScrollReveal';

const POLL_KEY = 'foodexpress_poll_ms';

const INTERVAL_OPTIONS = [
  { label: '10s', value: 10_000 },
  { label: '30s', value: 30_000 },
  { label: '1 min', value: 60_000 },
  { label: '3 min', value: 180_000 },
  { label: '5 min', value: 300_000 },
  { label: '10 min', value: 600_000 },
];

const TAB_FILTERS = [
  { key: 'active', label: 'Ativos na Cozinha' },
  { key: 'all', label: 'Todos os Pedidos' },
  { key: 'delivered', label: 'Entregues' },
  { key: 'cancelled', label: 'Cancelados' },
];

function getNextStatusLabel(currentStatus) {
  switch (currentStatus) {
    case 'RECEIVED':
      return 'Iniciar Preparo';
    case 'PREPARING':
      return 'Marcar Pronto';
    case 'READY':
      return 'Marcar Entregue';
    default:
      return 'Avançar';
  }
}

const statusSortOrder = { RECEIVED: 0, PREPARING: 1, READY: 2, DELIVERED: 3, CANCELLED: 4 };

export default function AdminOrdersPage() {
  const { isAuthenticated, logout } = useAuth();
  const { adminOrders, setAdminOrders, advanceOrderStatus, cancelOrder } = useOrders();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('active');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'DINE_IN' | 'DELIVERY'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [pollMs, setPollMs] = useState(() => {
    const saved = localStorage.getItem(POLL_KEY);
    return saved ? Number(saved) : 300_000;
  });
  const intervalRef = useRef(null);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Polling / Refresh do backend SQLite (com fallback de localStorage)
  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await adminApi.fetchOrders();
      if (data && Array.isArray(data.orders) && setAdminOrders) {
        setAdminOrders(data.orders);
        setBackendConnected(true);
      }
    } catch {
      setBackendConnected(false);
      try {
        const saved = localStorage.getItem('foodexpress_orders');
        if (saved && setAdminOrders) {
          setAdminOrders(JSON.parse(saved));
        }
      } catch {
        // Ignora erro de parsing
      }
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  }, [setAdminOrders]);

  useEffect(() => {
    if (isAuthenticated) {
      doRefresh();
    }
  }, [isAuthenticated, doRefresh]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(doRefresh, pollMs);
    return () => clearInterval(intervalRef.current);
  }, [pollMs, doRefresh]);

  const handlePollChange = (e) => {
    const val = Number(e.target.value);
    setPollMs(val);
    localStorage.setItem(POLL_KEY, String(val));
  };

  const handleAdvance = async (order) => {
    const currentIdx = ORDER_STATUS_SEQUENCE.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= ORDER_STATUS_SEQUENCE.length - 1) return;
    const nextStatus = ORDER_STATUS_SEQUENCE[currentIdx + 1];

    try {
      const data = await adminApi.advanceOrder(order.id, nextStatus);
      if (data && data.order && setAdminOrders) {
        setAdminOrders((prev) =>
          prev.map((o) => (o.id === order.id ? data.order : o))
        );
        setBackendConnected(true);
        return;
      }
    } catch {
      // Fallback local
    }
    advanceOrderStatus(order.id, nextStatus);
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Deseja realmente cancelar o pedido #${order.id}?`)) return;
    try {
      const data = await adminApi.cancelOrder(order.id);
      if (data && data.order && setAdminOrders) {
        setAdminOrders((prev) =>
          prev.map((o) => (o.id === order.id ? data.order : o))
        );
        setBackendConnected(true);
        return;
      }
    } catch {
      // Fallback local
    }
    cancelOrder(order.id);
  };

  // Simulate new order for demo/testing
  const handleSimulateNewOrder = (isDelivery = false) => {
    const newId = Math.floor(100 + Math.random() * 900);
    const mockOrder = {
      id: newId,
      orderType: isDelivery ? 'DELIVERY' : 'DINE_IN',
      status: 'RECEIVED',
      tableNumber: isDelivery ? null : String(Math.floor(1 + Math.random() * 20)),
      customerName: isDelivery ? 'Lucas Mendes (Delivery)' : null,
      deliveryAddress: isDelivery ? 'Av. Paulista, 1500 - Apto 82' : null,
      totalAmount: 58.80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: Date.now(),
          productNameSnapshot: 'X-Burger Artesanal',
          quantity: 1,
          variationNameSnapshot: 'Duplo 360g',
          addonsJsonSnapshot: JSON.stringify([{ name: 'Cheddar Extra', price: 4.0 }]),
          notes: 'Carne bem passada, maionese à parte.',
          unitPrice: 36.90,
          subtotal: 40.90,
        },
        {
          id: Date.now() + 1,
          productNameSnapshot: 'Aussie Cheese Fries',
          quantity: 1,
          variationNameSnapshot: 'Média',
          addonsJsonSnapshot: '[]',
          notes: '',
          unitPrice: 17.90,
          subtotal: 17.90,
        },
      ],
    };

    setAdminOrders((prev) => [mockOrder, ...prev]);
  };

  // Print thermal kitchen receipt
  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items
      .map(
        (i) => `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
        <span><strong>${i.quantity}x</strong> ${i.productNameSnapshot} ${
          i.variationNameSnapshot ? `(${i.variationNameSnapshot})` : ''
        }</span>
        <span>R$ ${i.subtotal.toFixed(2)}</span>
      </div>
      ${i.notes ? `<div style="font-size:11px;color:#c2410c;margin-bottom:6px;font-style:italic;">Obs: ${i.notes}</div>` : ''}
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda #${order.id} - FoodExpress</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 18px; max-width: 320px; margin: 0 auto; color: #000; }
            h2 { text-align: center; margin: 0 0 4px; font-size: 16px; font-weight: bold; }
            .meta { font-size: 11px; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 10px; line-height: 1.4; }
            .total { border-top: 1px dashed #000; padding-top: 8px; font-size: 15px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 10px; }
            .footer { font-size: 10px; text-align: center; margin-top: 16px; border-top: 1px solid #eee; padding-top: 8px; }
          </style>
        </head>
        <body>
          <h2>FOODEXPRESS STEAKHOUSE</h2>
          <div class="meta">
            <div><strong>PEDIDO #${order.id}</strong></div>
            <div>Atendimento: ${
              order.orderType === 'DINE_IN'
                ? `MESA ${order.tableNumber}`
                : `ENTREGA (${order.customerName || 'Cliente'})`
            }</div>
            <div>Horário: ${new Date(order.createdAt).toLocaleTimeString('pt-BR')}</div>
            ${order.deliveryAddress ? `<div>Endereço: ${order.deliveryAddress}</div>` : ''}
          </div>
          <div>${itemsHtml}</div>
          <div class="total">
            <span>TOTAL:</span>
            <span>R$ ${order.totalAmount.toFixed(2)}</span>
          </div>
          <div class="footer">
            *** COMANDA OPERACIONAL COZINHA ***<br>
            Bom preparo, equipe!
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp helper for delivery orders
  const handleOpenWhatsApp = (order) => {
    const text = `Olá ${order.customerName || 'Cliente'}! Aqui é do FoodExpress Steakhouse. Seu pedido #${order.id} está sendo preparado com muito capricho na cozinha e logo sairá para entrega! Qualquer dúvida, estamos à disposição.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter + sort
  const filteredOrders = useMemo(() => {
    let list = [...adminOrders];

    // Tab filter
    switch (activeTab) {
      case 'active':
        list = list.filter((o) => ['RECEIVED', 'PREPARING', 'READY'].includes(o.status));
        break;
      case 'delivered':
        list = list.filter((o) => o.status === 'DELIVERED');
        break;
      case 'cancelled':
        list = list.filter((o) => o.status === 'CANCELLED');
        break;
      default:
        break;
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      list = list.filter((o) => o.orderType === typeFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => {
        const matchId = String(o.id).includes(q);
        const matchCustomer = o.customerName && o.customerName.toLowerCase().includes(q);
        const matchTable = o.tableNumber && String(o.tableNumber).includes(q);
        const matchItems = o.items.some((i) =>
          i.productNameSnapshot.toLowerCase().includes(q)
        );
        return matchId || matchCustomer || matchTable || matchItems;
      });
    }

    list.sort((a, b) => {
      const sa = statusSortOrder[a.status] ?? 99;
      const sb = statusSortOrder[b.status] ?? 99;
      if (sa !== sb) return sa - sb;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [adminOrders, activeTab, typeFilter, searchQuery]);

  const countActive = useMemo(
    () => adminOrders.filter((o) => ['RECEIVED', 'PREPARING', 'READY'].includes(o.status)).length,
    [adminOrders]
  );
  const countDelivered = useMemo(
    () => adminOrders.filter((o) => o.status === 'DELIVERED').length,
    [adminOrders]
  );
  const countCancelled = useMemo(
    () => adminOrders.filter((o) => o.status === 'CANCELLED').length,
    [adminOrders]
  );

  const totalDeliveredRevenue = useMemo(() => {
    return adminOrders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [adminOrders]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-['Plus_Jakarta_Sans',sans-serif] antialiased flex flex-col selection:bg-orange-600">
      <Navbar
        isAdmin={true}
        onLogout={() => {
          logout();
          navigate('/admin/login');
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 overflow-x-hidden">
        {/* Top Header com Status em Tempo Real & Ações */}
        <ScrollReveal direction="up" duration={600}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121214] border border-zinc-800 text-orange-500 shadow-xl shrink-0">
                <ClipboardList className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-tight leading-none">
                    Fila de Pedidos &amp; KDS
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase font-['Oswald',sans-serif] tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {backendConnected ? 'Tempo Real • API SQLite' : 'Tempo Real'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Gerencie pedidos de salão e entrega com transição rápida de status e comandas.
                </p>
              </div>
            </div>

            {/* Ações de Teste & Atualização */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                onClick={() => handleSimulateNewOrder(false)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider bg-orange-600/15 hover:bg-orange-600 hover:text-white border border-orange-500/30 text-orange-400 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                title="Criar novo pedido de mesa para teste da cozinha"
              >
                <Plus className="w-4 h-4" />
                <span>Mesa Teste</span>
              </button>

              <button
                onClick={() => handleSimulateNewOrder(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider bg-blue-600/15 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-blue-400 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                title="Criar novo pedido de delivery para teste"
              >
                <Plus className="w-4 h-4" />
                <span>Delivery Teste</span>
              </button>

              <button
                onClick={doRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider bg-[#121214] hover:bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : 'text-zinc-400'}`}
                />
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              <div className="flex items-center gap-1.5 bg-[#121214] border border-zinc-800 rounded-xl px-2.5 py-2 shadow-lg">
                <Timer className="w-4 h-4 text-orange-500" />
                <select
                  value={pollMs}
                  onChange={handlePollChange}
                  className="text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider bg-transparent border-none focus:outline-none text-zinc-300 cursor-pointer"
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-200">
                      Auto: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Resumo de Indicadores Operacionais (KPIs) */}
        <ScrollReveal direction="up" duration={700}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
            <div className="bg-[#121214] p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                  Novos Pedidos
                </span>
                <span className="text-3xl font-black text-blue-400 mt-0.5 block font-['Oswald',sans-serif]">
                  {adminOrders.filter((o) => o.status === 'RECEIVED').length}
                </span>
                <span className="text-[10px] text-zinc-500">Aguardando início</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121214] p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                  Em Preparo
                </span>
                <span className="text-3xl font-black text-amber-400 mt-0.5 block font-['Oswald',sans-serif]">
                  {adminOrders.filter((o) => o.status === 'PREPARING').length}
                </span>
                <span className="text-[10px] text-zinc-500">Na grelha / montagem</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ChefHat className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121214] p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                  Prontos p/ Entrega
                </span>
                <span className="text-3xl font-black text-emerald-400 mt-0.5 block font-['Oswald',sans-serif]">
                  {adminOrders.filter((o) => o.status === 'READY').length}
                </span>
                <span className="text-[10px] text-zinc-500">Aguardando garçom/motoboy</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121214] p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block">
                  Faturamento Entregue
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5 block font-['Oswald',sans-serif]">
                  {formatPrice(totalDeliveredRevenue)}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {countDelivered} pedidos finalizados
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Barra de Filtros & Busca em Tempo Real */}
        <ScrollReveal direction="up" delay={50} duration={600}>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6 bg-[#121214] border border-zinc-800 p-3 sm:p-4 rounded-2xl shadow-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por #pedido, cliente, mesa ou item..."
                className="w-full bg-[#0c0a08] border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Tipo de Atendimento: Salão / Delivery */}
            <div className="flex items-center gap-1.5 bg-[#0c0a08] border border-zinc-800 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-all cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('DINE_IN')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-all cursor-pointer ${
                  typeFilter === 'DINE_IN'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Utensils size={13} />
                <span>Salão</span>
              </button>
              <button
                onClick={() => setTypeFilter('DELIVERY')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-all cursor-pointer ${
                  typeFilter === 'DELIVERY'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bike size={13} />
                <span>Delivery</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Abas de Status com Contadores */}
        <ScrollReveal direction="up" delay={80} duration={600}>
          <div className="flex gap-1.5 bg-[#121214] rounded-2xl p-1.5 border border-zinc-800 mb-7 overflow-x-auto shadow-xl">
            {TAB_FILTERS.map((tab) => {
              const count =
                tab.key === 'active'
                  ? countActive
                  : tab.key === 'all'
                  ? adminOrders.length
                  : tab.key === 'delivered'
                  ? countDelivered
                  : countCancelled;

              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 min-w-fit px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider font-['Oswald',sans-serif] rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/60'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      isSelected ? 'bg-orange-900/80 text-orange-200' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Fila de Pedidos */}
        {filteredOrders.length === 0 ? (
          <ScrollReveal direction="zoom" duration={500}>
            <div className="text-center py-20 bg-[#121214] rounded-3xl border border-zinc-800 shadow-xl">
              <PackageOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white uppercase font-['Oswald',sans-serif] tracking-wider">
                Nenhum pedido encontrado
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `Nenhum resultado corresponde à busca "${searchQuery}".`
                  : 'Nenhum pedido nesta fila no momento. Você pode clicar em "+ Mesa Teste" para simular um pedido.'}
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredOrders.map((order, idx) => (
              <ScrollReveal key={order.id} direction="up" delay={idx * 50} duration={600}>
                <OrderCard
                  order={order}
                  onAdvance={() => handleAdvance(order)}
                  onCancel={() => handleCancel(order)}
                  onPrint={() => handlePrintReceipt(order)}
                  onWhatsApp={() => handleOpenWhatsApp(order)}
                  onViewDetails={() => setSelectedOrderDetails(order)}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141210] border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase font-['Oswald',sans-serif] tracking-wider">
                  Detalhes Operacionais
                </span>
                <h2 className="text-xl font-black text-white uppercase font-['Oswald',sans-serif]">
                  Pedido #{selectedOrderDetails.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-[#0c0a08] border border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-400">Modalidade:</span>
                <span className="font-bold text-white">
                  {selectedOrderDetails.orderType === 'DINE_IN'
                    ? `Salão (Mesa ${selectedOrderDetails.tableNumber})`
                    : `Entrega (${selectedOrderDetails.customerName || 'Delivery'})`}
                </span>
              </div>

              {selectedOrderDetails.deliveryAddress && (
                <div className="p-3 rounded-xl bg-[#0c0a08] border border-zinc-800 text-xs">
                  <span className="text-zinc-400 block mb-1">Endereço de Entrega:</span>
                  <span className="text-white font-medium">{selectedOrderDetails.deliveryAddress}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#0c0a08] border border-zinc-800 text-xs space-y-2">
                <span className="text-zinc-400 block mb-1 font-bold uppercase font-['Oswald',sans-serif] tracking-wider">
                  Itens Cadastrados:
                </span>
                {selectedOrderDetails.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center text-xs border-b border-zinc-800/60 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-zinc-200">
                      <strong>{it.quantity}x</strong> {it.productNameSnapshot}
                    </span>
                    <span className="text-amber-400 font-bold">{formatPrice(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0c0a08] border border-zinc-800">
                <span className="text-xs font-bold uppercase font-['Oswald',sans-serif] text-zinc-400">
                  Total Final:
                </span>
                <span className="text-xl font-black text-amber-400 font-['Oswald',sans-serif]">
                  {formatPrice(selectedOrderDetails.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 mt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  handlePrintReceipt(selectedOrderDetails);
                }}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir Comanda</span>
              </button>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Card Operacional de Pedido ---------- */

function OrderCard({ order, onAdvance, onCancel, onPrint, onWhatsApp, onViewDetails }) {
  const isTerminal = order.status === 'DELIVERED' || order.status === 'CANCELLED';

  const statusConfig = {
    RECEIVED: {
      label: 'Novo Pedido',
      badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
      dotClass: 'bg-blue-400 animate-ping',
      btnBg: 'bg-orange-600 hover:bg-orange-500 shadow-orange-950/50',
      icon: Flame,
    },
    PREPARING: {
      label: 'Em Preparo',
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      dotClass: 'bg-amber-400 animate-pulse',
      btnBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50',
      icon: ChefHat,
    },
    READY: {
      label: 'Pronto p/ Entrega',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      dotClass: 'bg-emerald-400',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50',
      icon: CheckCircle2,
    },
    DELIVERED: {
      label: 'Entregue',
      badgeClass: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50',
      dotClass: 'bg-zinc-500',
      btnBg: 'bg-zinc-700',
      icon: CheckCircle2,
    },
    CANCELLED: {
      label: 'Cancelado',
      badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/30',
      dotClass: 'bg-red-500',
      btnBg: 'bg-zinc-800',
      icon: X,
    },
  }[order.status] || {
    label: order.status,
    badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    dotClass: 'bg-zinc-400',
    btnBg: 'bg-orange-600',
    icon: Flame,
  };

  const ActionIcon = statusConfig.icon;

  const addons = (item) => {
    try {
      const parsed =
        typeof item.addonsJsonSnapshot === 'string'
          ? JSON.parse(item.addonsJsonSnapshot)
          : item.addonsJsonSnapshot;
      return parsed || [];
    } catch {
      return [];
    }
  };

  return (
    <div className="bg-[#121214] rounded-2xl sm:rounded-3xl border border-zinc-800 hover:border-zinc-700/80 shadow-2xl transition-all overflow-hidden flex flex-col justify-between">
      {/* Topo do Card */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-tight">
                Pedido #{order.id}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {formatRelativeTime(order.createdAt)}
              </span>
            </div>

            {/* Tipo de Atendimento: Salão / Delivery */}
            <div className="mt-1 flex items-center gap-2">
              {order.orderType === 'DINE_IN' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400 uppercase font-['Oswald',sans-serif] tracking-wider">
                  <Utensils className="w-3.5 h-3.5" />
                  Salão — Mesa {order.tableNumber}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase font-['Oswald',sans-serif] tracking-wider">
                  <Bike className="w-3.5 h-3.5" />
                  Delivery — {order.customerName || 'Cliente'}
                </span>
              )}
            </div>

            {order.deliveryAddress && (
              <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1.5 leading-tight">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>{order.deliveryAddress}</span>
              </p>
            )}
          </div>

          {/* Badge de Status & Ações Rápidas */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] ${statusConfig.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.label}
            </span>

            {/* Ações Rápidas: Detalhes, Imprimir e WhatsApp */}
            <div className="flex items-center gap-1">
              <button
                onClick={onViewDetails}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Ver Detalhes da Comanda"
              >
                <Eye size={15} />
              </button>

              <button
                onClick={onPrint}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Imprimir Comanda da Cozinha"
              >
                <Printer size={15} />
              </button>

              {order.orderType === 'DELIVERY' && (
                <>
                  <Link
                    to={`/entregador?orderId=${order.id}`}
                    className="p-1.5 text-orange-400 hover:text-white hover:bg-orange-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Abrir Rota do Entregador (GPS / iFood)"
                  >
                    <Navigation size={15} />
                  </Link>

                  <button
                    onClick={onWhatsApp}
                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Avisar Cliente no WhatsApp"
                  >
                    <MessageCircle size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Itens do Pedido */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <div className="space-y-3">
            {order.items.map((item) => {
              const itemAddons = addons(item);
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 text-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-black text-xs font-['Oswald',sans-serif]">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-white text-sm">
                        {item.productNameSnapshot}
                      </span>
                      {item.variationNameSnapshot && (
                        <span className="text-xs font-medium text-zinc-400">
                          ({item.variationNameSnapshot})
                        </span>
                      )}
                    </div>

                    {itemAddons.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {itemAddons.map((addon, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium"
                          >
                            + {addon.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 flex items-center gap-1.5 font-medium">
                        <span>⚠️ Obs:</span>
                        <span>{item.notes}</span>
                      </div>
                    )}
                  </div>

                  <span className="font-bold text-amber-400 text-sm whitespace-nowrap pt-0.5">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totalizador */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/80">
          <span className="text-xs uppercase font-bold text-zinc-400 font-['Oswald',sans-serif] tracking-wider">
            Total do Pedido
          </span>
          <span className="text-2xl font-black text-white font-['Oswald',sans-serif] tracking-tight">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Botões de Ação Operacional */}
      {!isTerminal && (
        <div className="flex gap-2.5 p-5 pt-0">
          <button
            onClick={onAdvance}
            className={`flex-1 h-12 ${statusConfig.btnBg} active:scale-[0.98] text-white font-bold uppercase tracking-wider font-['Oswald',sans-serif] text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer`}
          >
            <ActionIcon className="w-4 h-4" />
            <span>{getNextStatusLabel(order.status)}</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </button>
          <button
            onClick={onCancel}
            className="h-12 px-4 rounded-xl border border-zinc-700/80 hover:border-red-500/60 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 font-bold uppercase tracking-wider font-['Oswald',sans-serif] text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Cancelar este pedido"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancelar</span>
          </button>
        </div>
      )}
    </div>
  );
}
