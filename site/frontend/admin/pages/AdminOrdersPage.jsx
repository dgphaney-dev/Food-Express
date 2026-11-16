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
import AdminLayout from '../components/AdminLayout';
import { playNewOrderChime } from '../utils/soundAlert';
import { printThermalReceipt } from '../utils/printReceipt';
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

  // Alerta sonoro automático para novos pedidos na cozinha
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (adminOrders && adminOrders.length > 0) {
      if (prevCountRef.current > 0 && adminOrders.length > prevCountRef.current) {
        playNewOrderChime();
      }
      prevCountRef.current = adminOrders.length;
    }
  }, [adminOrders]);

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

  // Simulate new order for demo/testing (persisted in SQLite backend)
  const handleSimulateNewOrder = async (isDelivery = false) => {
    try {
      const data = await adminApi.simulateIncomingOrder(isDelivery);
      if (data && data.order && setAdminOrders) {
        setAdminOrders((prev) => [data.order, ...prev]);
        setBackendConnected(true);
        return;
      }
    } catch {
      // Fallback local se offline
    }

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
    printThermalReceipt(order);
  };

  // WhatsApp helper for delivery orders
  const handleOpenWhatsApp = (order) => {
    const text = `Olá ${order.customerName || 'Cliente'}! Aqui é do FoodExpress Steakhouse. Seu pedido #${order.id} está sendo preparado com muito capricho na cozinha e logo sairá para entrega! Qualquer dúvida, estamos à disposição.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter + sort
  const filteredOrders = useMemo(() => {
    let list = Array.isArray(adminOrders) ? [...adminOrders] : [];

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

  const safeAdminOrders = Array.isArray(adminOrders) ? adminOrders : [];

  const countActive = useMemo(
    () => safeAdminOrders.filter((o) => ['RECEIVED', 'PREPARING', 'READY'].includes(o.status)).length,
    [safeAdminOrders]
  );
  const countDelivered = useMemo(
    () => safeAdminOrders.filter((o) => o.status === 'DELIVERED').length,
    [safeAdminOrders]
  );
  const countCancelled = useMemo(
    () => safeAdminOrders.filter((o) => o.status === 'CANCELLED').length,
    [safeAdminOrders]
  );

  const totalDeliveredRevenue = useMemo(() => {
    return safeAdminOrders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [safeAdminOrders]);

  if (!isAuthenticated) return null;

  return (
    <AdminLayout
      title="Fila de Pedidos & KDS"
      subtitle="Gerencie pedidos de salão e entrega com transição rápida de status e comandas"
      onSimulateOrder={handleSimulateNewOrder}
      onRefresh={doRefresh}
      refreshing={refreshing}
      pollMs={pollMs}
      onPollChange={handlePollChange}
      pollOptions={INTERVAL_OPTIONS}
    >
      <div className="w-full">
        {/* Barra de Filtros & Busca em Tempo Real */}
        <ScrollReveal direction="up" duration={600}>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6 bg-[#12100e] border border-[#26201b] p-3 sm:p-4 rounded-2xl shadow-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por #pedido, cliente, mesa ou item..."
                className="w-full bg-[#0a0908] border border-[#2d2520] rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
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
            <div className="flex items-center gap-1.5 bg-[#0a0908] border border-[#2d2520] p-1 rounded-xl shrink-0">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-all cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-[#1c1714] text-amber-400 border border-[#3d3128] shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('DINE_IN')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-all cursor-pointer ${
                  typeFilter === 'DINE_IN'
                    ? 'bg-[#1c1714] text-amber-400 border border-[#3d3128] shadow-sm'
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
                    ? 'bg-[#1c1714] text-amber-400 border border-[#3d3128] shadow-sm'
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
          <div className="flex gap-1.5 bg-[#12100e] rounded-2xl p-1.5 border border-[#26201b] mb-7 overflow-x-auto shadow-xl">
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
                      ? 'bg-[#1c1714] text-amber-400 border border-[#3d3128] shadow-sm'
                      : 'text-zinc-400 hover:bg-[#181411] hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      isSelected ? 'bg-[#241c17] text-amber-400 border border-[#3a2f26]' : 'bg-[#1a1714] text-zinc-400'
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
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#12100e] border border-[#26201b] rounded-3xl max-w-md w-full p-6 shadow-2xl text-white animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#26201b] mb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase font-['Oswald',sans-serif] tracking-wider">
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
              <div className="p-3 rounded-xl bg-[#0a0908] border border-[#26201b] flex justify-between items-center">
                <span className="text-xs text-zinc-400">Modalidade:</span>
                <span className="font-bold text-white">
                  {selectedOrderDetails.orderType === 'DINE_IN'
                    ? `Salão (Mesa ${selectedOrderDetails.tableNumber})`
                    : `Entrega (${selectedOrderDetails.customerName || 'Delivery'})`}
                </span>
              </div>

              {selectedOrderDetails.deliveryAddress && (
                <div className="p-3 rounded-xl bg-[#0a0908] border border-[#26201b] text-xs">
                  <span className="text-zinc-400 block mb-1">Endereço de Entrega:</span>
                  <span className="text-white font-medium">{selectedOrderDetails.deliveryAddress}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#0a0908] border border-[#26201b] text-xs space-y-2">
                <span className="text-zinc-400 block mb-1 font-bold uppercase font-['Oswald',sans-serif] tracking-wider">
                  Itens Cadastrados:
                </span>
                {selectedOrderDetails.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center text-xs border-b border-[#26201b] pb-1.5 last:border-0 last:pb-0">
                    <span className="text-zinc-200">
                      <strong>{it.quantity}x</strong> {it.productNameSnapshot}
                    </span>
                    <span className="text-amber-400 font-bold">{formatPrice(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0a0908] border border-[#26201b]">
                <span className="text-xs font-bold uppercase font-['Oswald',sans-serif] text-zinc-400">
                  Total Final:
                </span>
                <span className="text-xl font-black text-amber-400 font-['Oswald',sans-serif]">
                  {formatPrice(selectedOrderDetails.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 mt-4 border-t border-[#26201b]">
              <button
                onClick={() => {
                  handlePrintReceipt(selectedOrderDetails);
                }}
                className="flex-1 py-2.5 bg-[#161310] hover:bg-[#201a15] border border-[#332921] text-stone-200 font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer size={15} className="text-stone-400" />
                <span>Imprimir Comanda</span>
              </button>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2.5 bg-[#1c1714] hover:bg-[#261f1a] text-amber-400 border border-[#3d3128] font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/* ---------- Card Operacional de Pedido ---------- */

function OrderCard({ order, onAdvance, onCancel, onPrint, onWhatsApp, onViewDetails }) {
  const isTerminal = order.status === 'DELIVERED' || order.status === 'CANCELLED';

  const statusConfig = {
    RECEIVED: {
      label: 'Novo Pedido',
      badgeClass: 'bg-[#181411] text-amber-300 border border-[#3d3128]',
      dotClass: 'bg-amber-400',
      btnBg: 'bg-[#1c1714] hover:bg-[#261f1a] text-amber-400 border border-[#3d3128]',
      icon: Flame,
    },
    PREPARING: {
      label: 'Em Preparo',
      badgeClass: 'bg-[#181411] text-amber-400 border border-[#3d3128]',
      dotClass: 'bg-amber-400',
      btnBg: 'bg-[#1c1714] hover:bg-[#261f1a] text-amber-400 border border-[#3d3128]',
      icon: ChefHat,
    },
    READY: {
      label: 'Pronto p/ Entrega',
      badgeClass: 'bg-[#131713] text-emerald-400/90 border border-emerald-900/30',
      dotClass: 'bg-emerald-400/80',
      btnBg: 'bg-[#131713] hover:bg-[#1a221a] text-emerald-400 border border-emerald-900/40',
      icon: CheckCircle2,
    },
    DELIVERED: {
      label: 'Entregue',
      badgeClass: 'bg-[#141414] text-zinc-400 border border-zinc-800',
      dotClass: 'bg-zinc-500',
      btnBg: 'bg-zinc-800 text-zinc-300',
      icon: CheckCircle2,
    },
    CANCELLED: {
      label: 'Cancelado',
      badgeClass: 'bg-[#1a1212] text-red-400/80 border border-red-950/60',
      dotClass: 'bg-red-500/80',
      btnBg: 'bg-zinc-800 text-zinc-400',
      icon: X,
    },
  }[order.status] || {
    label: order.status,
    badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    dotClass: 'bg-zinc-400',
    btnBg: 'bg-[#1c1714] text-amber-400 border border-[#3d3128]',
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181411] border border-[#2d2520] text-xs font-bold text-stone-300 uppercase font-['Oswald',sans-serif] tracking-wider">
                  <Utensils className="w-3.5 h-3.5 text-amber-500/80" />
                  Salão — Mesa {order.tableNumber}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181411] border border-[#2d2520] text-xs font-bold text-stone-300 uppercase font-['Oswald',sans-serif] tracking-wider">
                  <Bike className="w-3.5 h-3.5 text-stone-400" />
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
                    className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-[#1f1915] rounded-lg transition-colors cursor-pointer"
                    title="Abrir Rota do Entregador (GPS / iFood)"
                  >
                    <Navigation size={15} />
                  </Link>

                  <button
                    onClick={onWhatsApp}
                    className="p-1.5 text-emerald-400/90 hover:text-emerald-300 hover:bg-[#141a14] rounded-lg transition-colors cursor-pointer"
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
                  className="p-3 rounded-xl bg-[#0e0c0a] border border-[#26201b] flex items-start justify-between gap-3 text-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#1c1714] text-amber-400 border border-[#382d24] font-black text-xs font-['Oswald',sans-serif]">
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
                            className="text-[11px] px-2 py-0.5 rounded bg-[#181411] border border-[#2d2520] text-zinc-300 font-medium"
                          >
                            + {addon.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-[#1a1510] border border-[#3d2e1e] text-xs text-amber-300/90 flex items-center gap-1.5 font-medium">
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
            className={`flex-1 h-12 ${statusConfig.btnBg} active:scale-[0.98] font-bold uppercase tracking-wider font-['Oswald',sans-serif] text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer`}
          >
            <ActionIcon className="w-4 h-4" />
            <span>{getNextStatusLabel(order.status)}</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </button>
          <button
            onClick={onCancel}
            className="h-12 px-4 rounded-xl border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 font-bold uppercase tracking-wider font-['Oswald',sans-serif] text-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
