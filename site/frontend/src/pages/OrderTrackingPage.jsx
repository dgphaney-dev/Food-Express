import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrders } from '../contexts/OrderContext';
import { RESTAURANT_CONFIG, ORDER_STATUS } from '../data/mockData';
import {
  formatPrice,
  generateWhatsAppMessage,
  generateWhatsAppUrl,
  canCustomerCancel,
  getRemainingCancelSeconds,
  formatTime,
  formatRelativeTime,
} from '../utils/helpers';
import Navbar from '../components/Navbar';
import OrderStatusStepper from '../components/OrderStatusStepper';
import ScrollReveal from '../components/ScrollReveal';
import {
  ArrowLeft,
  MessageCircle,
  XCircle,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  AlertCircle,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  KeyRound,
  Phone,
  X,
} from 'lucide-react';

// Dados do motorista parceiro atribuído
const DRIVER_INFO = {
  name: 'Carlos Roberto',
  vehicle: 'Honda CG 160 Fan · Placa BRA-2026',
  rating: '4.98',
  deliveries: 1248,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getOrder, fetchOrderById, currentOrder, cancelOrder, markOrderAsPaid } = useOrders();

  // Sincroniza o pedido com o backend SQLite ao abrir a página e a cada 10s
  useEffect(() => {
    if (!orderId) return;
    fetchOrderById(orderId);
    const interval = setInterval(() => {
      fetchOrderById(orderId);
    }, 10000);
    return () => clearInterval(interval);
  }, [orderId, fetchOrderById]);

  // Look up order
  const order = useMemo(() => {
    return (
      getOrder(orderId) ||
      (currentOrder && String(currentOrder.id) === String(orderId)
        ? currentOrder
        : null)
    );
  }, [getOrder, orderId, currentOrder]);

  // Cancel timer countdown
  const [cancelRemaining, setCancelRemaining] = useState(0);

  useEffect(() => {
    if (!order) return;

    const update = () => {
      if (canCustomerCancel(order)) {
        setCancelRemaining(getRemainingCancelSeconds(order.createdAt));
      } else {
        setCancelRemaining(0);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order]);

  // Estados de Pagamento & PIX
  const [showPixPayModal, setShowPixPayModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Posição simulada da moto na rota para a visão do cliente
  const [bikePosition, setBikePosition] = useState(40);

  useEffect(() => {
    if (!order || order.status !== 'READY') return;
    const interval = setInterval(() => {
      setBikePosition((prev) => (prev >= 90 ? 90 : prev + 1.5));
    }, 2000);
    return () => clearInterval(interval);
  }, [order]);

  // Handlers
  const handleCancel = useCallback(async () => {
    if (!order) return;
    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.'
    );
    if (confirmed) {
      try {
        await cancelOrder(order.id, false);
      } catch (err) {
        alert(
          err.message ||
            'Não foi possível cancelar o pedido (prazo de 5 minutos expirado ou preparo já iniciado).'
        );
      }
    }
  }, [order, cancelOrder]);

  const handleWhatsApp = useCallback(() => {
    if (!order) return;
    if (order.whatsappUrl) {
      window.open(order.whatsappUrl, '_blank');
      return;
    }
    const message = generateWhatsAppMessage(order);
    const url = generateWhatsAppUrl(RESTAURANT_CONFIG.whatsappNumber, message);
    window.open(url, '_blank');
  }, [order]);

  const handleSimulatePayment = () => {
    if (!order) return;
    setIsPaying(true);
    setTimeout(() => {
      markOrderAsPaid(order.id, 'PIX');
      setIsPaying(false);
      setShowPixPayModal(false);
    }, 1000);
  };

  // Código PIN esperado para validação
  const customerPin = useMemo(() => {
    if (!order) return '8492';
    const cleanId = String(order.id).replace(/\D/g, '');
    return cleanId.length >= 4 ? cleanId.slice(-4) : '8492';
  }, [order]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-neutral-100">
        <Navbar isAdmin={false} />
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <AlertCircle className="w-16 h-16 text-neutral-600 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Pedido não encontrado</h1>
          <p className="text-neutral-400 text-center mb-6">
            Não conseguimos localizar o pedido #{orderId}. Verifique o número ou faça um novo pedido.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors min-h-[44px]"
          >
            <ShoppingBag className="w-5 h-5" />
            Ir para o cardápio
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS[order.status] || ORDER_STATUS.RECEIVED;
  const isCancelled = order.status === 'CANCELLED';
  const isDelivery = order.orderType === 'DELIVERY';
  const isDelivered = order.status === 'DELIVERED';
  const showCancelButton = canCustomerCancel(order) && cancelRemaining > 0;
  const isPaid = !!order.isPaid;

  const parseAddons = (addonsJson) => {
    try {
      return typeof addonsJson === 'string' ? JSON.parse(addonsJson) : addonsJson || [];
    } catch {
      return [];
    }
  };

  const clientAddress = order.deliveryAddress || 'Av. Paulista, 1200 - São Paulo';
  const driverWhatsAppUrl = `https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(
    `Olá Carlos! Sou o cliente do pedido #${order.id}. Estou aguardando a entrega no endereço: ${clientAddress}.`
  )}`;

  return (
    <div className="min-h-screen bg-black text-neutral-100 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar isAdmin={false} />

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Voltar ao cardápio */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-orange-400 text-xs uppercase font-bold tracking-wider font-['Oswald',sans-serif] mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao cardápio
        </button>

        {/* 1. STATUS DE PAGAMENTO (ATIVO APÓS PAGAR) */}
        <ScrollReveal direction="down" duration={500}>
          {isPaid ? (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 mb-4 shadow-lg shadow-emerald-950/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-['Oswald',sans-serif]">
                      PAGAMENTO CONFIRMADO · PEDIDO ATIVO
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Seu pedido já foi aprovado e está sendo preparado com todo o carinho pelo Chef!
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-block px-3 py-1 rounded-lg bg-emerald-900/60 text-emerald-300 text-xs font-black font-['Oswald',sans-serif] shrink-0 uppercase">
                {order.paymentMethod === 'PIX' ? 'Pago via PIX' : 'Pago Online'}
              </span>
            </div>
          ) : (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 mb-4 shadow-lg shadow-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <QrCode size={22} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-['Oswald',sans-serif]">
                    Aguardando Pagamento · {formatPrice(order.totalAmount)}
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Pague via PIX para ativar seu pedido instantaneamente na cozinha e liberar o entregador.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPixPayModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider font-['Oswald',sans-serif] transition-all cursor-pointer shadow-md shadow-emerald-950/60 flex items-center justify-center gap-2 shrink-0"
              >
                <QrCode size={14} />
                <span>Pagar Agora via PIX</span>
              </button>
            </div>
          )}
        </ScrollReveal>

        {/* 2. CABEÇALHO DO PEDIDO */}
        <ScrollReveal direction="up" duration={600}>
          <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 mb-4 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-tight">
                Pedido #{order.id}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider font-['Oswald',sans-serif] ${statusConfig.bgLight} ${statusConfig.textColor}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-neutral-400">{formatRelativeTime(order.createdAt)}</p>

            <div className="flex items-center gap-2 mt-3 text-xs text-neutral-300">
              {isDelivery ? (
                <>
                  <Truck className="w-4 h-4 text-orange-400" />
                  <span>
                    Entrega para: <strong>{order.customerName || 'Cliente'}</strong>
                  </span>
                  {order.deliveryAddress && (
                    <span className="text-neutral-500 hidden sm:inline">
                      · {order.deliveryAddress}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                  <span>
                    Consumo no Salão — Mesa <strong>{order.tableNumber}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* 3. SE FOR DELIVERY: RASTREAMENTO DO MOTORISTA AO VIVO COM CÓDIGO PIN (ESTILO IFOOD) */}
        {isDelivery && !isCancelled && (
          <ScrollReveal direction="up" delay={50} duration={600}>
            <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 mb-4 shadow-xl space-y-4">
              
              {/* CÓDIGO DE CONFIRMAÇÃO DO CLIENTE (PIN DE 4 DÍGITOS) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-zinc-900 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-400 text-xs font-black uppercase font-['Oswald',sans-serif] tracking-wider">
                    <KeyRound size={15} />
                    <span>CÓDIGO DE ENTREGA DO CLIENTE (PIN)</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-sm">
                    Informe estes 4 dígitos ao entregador Carlos quando ele chegar na portaria para confirmar o recebimento do pacote.
                  </p>
                </div>

                <div className="px-5 py-2.5 rounded-xl bg-black border-2 border-amber-400 shadow-lg text-2xl font-black text-amber-400 tracking-widest font-['Oswald',sans-serif]">
                  {customerPin}
                </div>
              </div>

              {/* CARD DO MOTORISTA PARCEIRO */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={DRIVER_INFO.avatarUrl}
                    alt={DRIVER_INFO.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-500 shadow-md ring-2 ring-orange-500/20"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white uppercase font-['Oswald',sans-serif]">
                        {DRIVER_INFO.name}
                      </h4>
                      <span className="px-2 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                        ⭐ {DRIVER_INFO.rating}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{DRIVER_INFO.vehicle}</p>
                    <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
                      {isDelivered
                        ? 'Entrega finalizada com sucesso!'
                        : order.status === 'READY'
                        ? '🛵 Carlos está em rota até você!'
                        : 'Aguardando liberação do pedido na cozinha'}
                    </span>
                  </div>
                </div>

                {/* Ações de contato com o motorista */}
                <div className="flex items-center gap-2">
                  <a
                    href={driverWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md cursor-pointer"
                    title="Falar com o entregador no WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </a>
                  <a
                    href="tel:11999999999"
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-neutral-200 transition-all cursor-pointer"
                    title="Ligar para o entregador"
                  >
                    <Phone size={16} />
                  </a>
                </div>
              </div>

              {/* MAPA GPS AO VIVO COM A MOTO DO MOTORISTA */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c0a08] h-60 shadow-inner group">
                <svg className="w-full h-full opacity-70" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="client-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                      <rect width="80" height="80" fill="#0b0e14" />
                      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1f2937" strokeWidth="2" />
                      <rect x="10" y="10" width="60" height="60" rx="6" fill="#131b26" stroke="#1b2433" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="client-route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#client-grid)" />

                  {/* Vias demarcadas */}
                  <line x1="0" y1="160" x2="600" y2="60" stroke="#2a3547" strokeWidth="12" />
                  <text x="30" y="150" fill="#4b5563" fontSize="9" fontWeight="bold">
                    AV. PAULISTA
                  </text>

                  {/* Rota */}
                  <path
                    d="M 60 160 Q 200 140 320 110 T 480 80"
                    fill="none"
                    stroke="url(#client-route-grad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 60 160 Q 200 140 320 110 T 480 80"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4,6"
                    className="animate-pulse"
                  />

                  {/* Origem: Restaurante */}
                  <circle cx="60" cy="160" r="10" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
                  <text x="60" y="180" fill="#f97316" fontSize="9" textAnchor="middle" fontWeight="bold">
                    FoodExpress
                  </text>

                  {/* Destino: Cliente */}
                  <circle cx="480" cy="80" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <text x="480" y="100" fill="#34d399" fontSize="9" textAnchor="middle" fontWeight="bold">
                    Sua Casa 📍
                  </text>

                  {/* Moto do Carlos em Movimento */}
                  <g transform={`translate(${60 + (480 - 60) * (bikePosition / 100)}, ${160 + (80 - 160) * (bikePosition / 100)})`}>
                    <circle cx="0" cy="0" r="12" fill="#fbbf24" stroke="#000000" strokeWidth="2" className="animate-ping opacity-40" />
                    <circle cx="0" cy="0" r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    <text x="0" y="3" fill="#000000" fontSize="10" textAnchor="middle">🛵</text>
                  </g>
                </svg>

                {/* Badge de status no mapa */}
                <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-zinc-700 px-3 py-1.5 rounded-full text-[11px] font-bold text-white uppercase font-['Oswald',sans-serif] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Rastreamento em Tempo Real · Chegada em ~12 min</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* 4. STEPPER DE STATUS */}
        <ScrollReveal direction="up" delay={100} duration={600}>
          <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 mb-4 shadow-xl">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-['Oswald',sans-serif] mb-4">
              Etapas do Pedido
            </h2>
            <OrderStatusStepper currentStatus={order.status} />
          </div>
        </ScrollReveal>

        {/* 5. ITENS DO PEDIDO */}
        <ScrollReveal direction="up" delay={150} duration={600}>
          <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 mb-4 shadow-xl">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-['Oswald',sans-serif] mb-4">
              Itens da Sua Comanda
            </h2>

            <div className="space-y-3">
              {order.items.map((item) => {
                const addons = parseAddons(item.addonsJsonSnapshot);
                return (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 pb-3 border-b border-zinc-800/80 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">
                        {item.quantity}x {item.productNameSnapshot}
                      </p>
                      {item.variationNameSnapshot && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Variação: {item.variationNameSnapshot}
                        </p>
                      )}
                      {addons.length > 0 && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          + {addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-orange-400 italic mt-0.5">Obs: {item.notes}</p>
                      )}
                    </div>
                    <p className="text-xs font-bold text-amber-400 whitespace-nowrap">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Totalizador */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <span className="text-xs font-bold uppercase font-['Oswald',sans-serif] text-neutral-400">
                Total Final
              </span>
              <span className="text-xl font-black text-amber-400 font-['Oswald',sans-serif]">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* WhatsApp do Restaurante */}
        {!isCancelled && (
          <ScrollReveal direction="up" delay={180} duration={600}>
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider py-3.5 rounded-xl transition-colors mb-3 shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Resumo do Pedido ao Restaurante (WhatsApp)</span>
            </button>
          </ScrollReveal>
        )}

        {/* 6. BOTÃO DE CANCELAR (DENTRO DA JANELA DE 5 MIN) */}
        {showCancelButton && (
          <ScrollReveal direction="up" delay={200} duration={600}>
            <button
              onClick={handleCancel}
              className="w-full flex items-center justify-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-950/30 font-bold text-xs uppercase tracking-wider font-['Oswald',sans-serif] py-3.5 rounded-xl transition-colors mb-4 min-h-[44px] cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Cancelar pedido ({formatTime(cancelRemaining)})
            </button>
          </ScrollReveal>
        )}

        {/* Link para novo pedido */}
        <ScrollReveal direction="up" delay={250} duration={600}>
          <Link
            to="/"
            className="block w-full text-center text-orange-400 hover:text-orange-300 font-bold text-xs uppercase tracking-wider font-['Oswald',sans-serif] py-3 transition-colors"
          >
            ← Fazer um novo pedido no cardápio
          </Link>
        </ScrollReveal>
      </div>

      {/* MODAL DE PAGAMENTO PIX DIRETO NA TELA DO PEDIDO */}
      {showPixPayModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121214] rounded-3xl border border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-emerald-400" />
                <h3 className="text-base font-black text-white uppercase font-['Oswald',sans-serif] tracking-wider">
                  Pagar Pedido via PIX
                </h3>
              </div>
              <button
                onClick={() => setShowPixPayModal(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-[11px] uppercase font-bold text-zinc-400 font-['Oswald',sans-serif] tracking-wider block">
                Valor Total do Pedido #{order.id}
              </span>
              <span className="text-2xl font-black text-amber-400 font-['Oswald',sans-serif]">
                {formatPrice(order.totalAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center relative shadow-lg">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=foodexpress-pix-demo"
                alt="QR Code Pix FoodExpress"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX0136foodexpress-${order.id}`);
                setPixCopied(true);
                setTimeout(() => setPixCopied(false), 2000);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 uppercase font-['Oswald',sans-serif] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {pixCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{pixCopied ? 'Chave PIX Copiada!' : 'Copiar Chave PIX (Copia e Cola)'}</span>
            </button>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isPaying}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/60"
            >
              {isPaying ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar Pagamento e Ativar Pedido</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
