import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bike,
  Navigation,
  Phone,
  MessageCircle,
  CheckCircle2,
  Compass,
  KeyRound,
  ExternalLink,
  Check,
  ChevronDown,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/helpers';
import { driverApi } from '../services/api';
import Navbar from '../components/Navbar';
import ScrollReveal from '../components/ScrollReveal';
import ModalPortal from '../components/ModalPortal';

// Restaurante de Origem
const RESTAURANT_LOCATION = {
  name: 'FoodExpress Steakhouse',
  address: 'Av. Paulista, 1200 - Bela Vista, São Paulo - SP',
  lat: -23.5658,
  lng: -46.6549,
};

export default function DriverDeliveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { adminOrders, setAdminOrders, advanceOrderStatus } = useOrders();
  const { user: loggedUser } = useAuth();

  // Carrega entregas reais diretamente do backend SQLite
  useEffect(() => {
    let active = true;
    driverApi
      .listOrders()
      .then((data) => {
        if (active && Array.isArray(data?.orders) && setAdminOrders) {
          setAdminOrders((prev) => {
            const nonDelivery = (Array.isArray(prev) ? prev : []).filter(
              (o) => o.orderType !== 'DELIVERY'
            );
            return [...data.orders, ...nonDelivery];
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [setAdminOrders]);

  // Filtrar todos os pedidos de entrega ativos ou concluídos recentemente
  const deliveryOrders = useMemo(() => {
    return (Array.isArray(adminOrders) ? adminOrders : []).filter((o) => o.orderType === 'DELIVERY');
  }, [adminOrders]);

  const driverDisplayName = loggedUser?.name || loggedUser?.username || 'Entregador FoodExpress';
  const todayDeliveredCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return deliveryOrders.filter(
      (o) => o.status === 'DELIVERED' && String(o.updatedAt || o.createdAt || '').startsWith(todayStr)
    ).length;
  }, [deliveryOrders]);

  // ID do pedido selecionado pela URL ou o primeiro disponível
  const paramOrderId = searchParams.get('orderId');
  const selectedOrder = useMemo(() => {
    if (paramOrderId) {
      const found = deliveryOrders.find((o) => String(o.id) === String(paramOrderId));
      if (found) return found;
    }
    // Caso padrão: primeiro pedido não cancelado ou o mais recente
    return (
      deliveryOrders.find((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED') ||
      deliveryOrders[0] ||
      null
    );
  }, [deliveryOrders, paramOrderId]);

  // Estados da simulação de entrega
  const [driverStage, setDriverStage] = useState('TRANSIT_TO_CLIENT'); // 'AT_STORE' | 'TRANSIT_TO_CLIENT' | 'ARRIVED_AT_CLIENT' | 'COMPLETED'
  const [isOnline, setIsOnline] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mapMode, setMapMode] = useState('vector'); // 'vector' | 'satellite'
  const [bikePosition, setBikePosition] = useState(35); // 0% a 100% da rota
  const [checkedItems, setCheckedItems] = useState({});
  const [pinCode, setPinCode] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const [showOrderSelector, setShowOrderSelector] = useState(false);

  // Sincronizar estágio do motorista com o status real do pedido
  useEffect(() => {
    if (!selectedOrder) return;
    if (selectedOrder.status === 'DELIVERED') {
      setDriverStage('COMPLETED');
      setBikePosition(100);
      setCompletedSuccess(true);
    } else if (selectedOrder.status === 'READY') {
      setDriverStage('TRANSIT_TO_CLIENT');
      setBikePosition(45);
      setCompletedSuccess(false);
    } else if (selectedOrder.status === 'RECEIVED' || selectedOrder.status === 'PREPARING') {
      setDriverStage('AT_STORE');
      setBikePosition(5);
      setCompletedSuccess(false);
    }
  }, [selectedOrder]);

  // Simulação de movimento suave da moto na rota durante o trânsito
  useEffect(() => {
    if (driverStage !== 'TRANSIT_TO_CLIENT') return;
    const interval = setInterval(() => {
      setBikePosition((prev) => {
        if (prev >= 92) return 92;
        return prev + 1.2;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [driverStage]);

  // Código PIN esperado do pedido real
  const expectedPin = useMemo(() => {
    if (!selectedOrder) return '';
    return selectedOrder.deliveryPin ? String(selectedOrder.deliveryPin) : '';
  }, [selectedOrder]);

  // Ações de alteração de estágio da corrida
  const handleConfirmStorePickup = () => {
    if (selectedOrder) {
      advanceOrderStatus(selectedOrder.id, 'READY');
    }
    setDriverStage('TRANSIT_TO_CLIENT');
    setBikePosition(20);
  };

  const handleArrivedAtClient = () => {
    setDriverStage('ARRIVED_AT_CLIENT');
    setBikePosition(98);
  };

  const handleOpenPinModal = () => {
    setPinError('');
    setPinCode('');
    setShowPinModal(true);
  };

  const handleConfirmDeliveryPin = async () => {
    const cleanPin = pinCode.trim();
    if (cleanPin.length !== 4) {
      setPinError('Informe o código PIN de 4 dígitos fornecido pelo cliente.');
      return;
    }

    if (!selectedOrder) return;

    try {
      await driverApi.confirmPin(selectedOrder.id, cleanPin);
      advanceOrderStatus(selectedOrder.id, 'DELIVERED');
      setDriverStage('COMPLETED');
      setBikePosition(100);
      setCompletedSuccess(true);
      setShowPinModal(false);
    } catch (err) {
      if (err.status === 400 || err.status === 422) {
        setPinError(err.message || 'Código PIN incorreto. Verifique com o cliente.');
      } else if (expectedPin && cleanPin === expectedPin) {
        advanceOrderStatus(selectedOrder.id, 'DELIVERED');
        setDriverStage('COMPLETED');
        setBikePosition(100);
        setCompletedSuccess(true);
        setShowPinModal(false);
      } else {
        setPinError('Código PIN incorreto. Verifique os 4 dígitos informados pelo cliente.');
      }
    }
  };

  // Toggle checklist de conferência de itens na bag
  const toggleCheckItem = (itemId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Links externos de GPS
  const clientAddress = selectedOrder?.deliveryAddress || 'Endereço não informado';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    RESTAURANT_LOCATION.address
  )}&destination=${encodeURIComponent(clientAddress)}&travelmode=two_wheeler`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(clientAddress)}&navigate=yes`;

  // WhatsApp direto do cliente
  const cleanCustomerPhone = (selectedOrder?.customerPhone || '').replace(/\D/g, '');
  const clientWhatsAppUrl = cleanCustomerPhone
    ? `https://api.whatsapp.com/send?phone=${cleanCustomerPhone}&text=${encodeURIComponent(
        `Olá ${selectedOrder?.customerName || 'Cliente'}! Aqui é o entregador do FoodExpress. Estou a caminho com o seu pedido #${selectedOrder?.id || ''}!`
      )}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `Olá ${selectedOrder?.customerName || 'Cliente'}! Aqui é o entregador do FoodExpress. Estou a caminho com o seu pedido #${selectedOrder?.id || ''}!`
      )}`;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-['Plus_Jakarta_Sans',sans-serif] antialiased flex flex-col selection:bg-orange-600">
      {/* 1. TOP NAVBAR */}
      <Navbar isAdmin={false} />

      {/* 2. SUB-HEADER: BARRA DO ENTREGADOR (ESTILO IFOOD DRIVER APP) */}
      <div className="bg-[#121214] border-b border-zinc-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Perfil & Status do Piloto */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#1c1714] border-2 border-orange-500 shadow-md ring-2 ring-orange-500/20 flex items-center justify-center text-amber-400">
                <Bike size={22} />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                }`}
                title={isOnline ? 'Online para entregas' : 'Offline'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white uppercase font-['Oswald',sans-serif] tracking-wider">
                  {driverDisplayName}
                </h2>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <span className="text-emerald-400 font-bold">
                  {isOnline ? 'Disponível no FoodExpress Entregas' : 'Pausado'}
                </span>
                <span>•</span>
                <span>{todayDeliveredCount} {todayDeliveredCount === 1 ? 'entrega hoje' : 'entregas hoje'}</span>
              </p>
            </div>
          </div>

          {/* Status & Botão Online Toggle */}
          <div className="flex items-center gap-3">

            {/* Toggle Online */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-zinc-500'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            {/* Seletor de Corrida / Alternar Pedido */}
            <div className="relative">
              <button
                onClick={() => setShowOrderSelector(!showOrderSelector)}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Bike size={14} className="text-orange-500" />
                <span className="hidden sm:inline">Corridas</span>
                <span className="px-1.5 py-0.2 rounded bg-orange-600 text-white text-[10px]">
                  {deliveryOrders.length}
                </span>
                <ChevronDown size={14} />
              </button>

              {/* Dropdown de Corridas */}
              {showOrderSelector && (
                <div className="absolute right-0 mt-2 w-72 bg-[#121214] border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50">
                  <div className="text-xs font-bold uppercase text-zinc-400 p-2 font-['Oswald',sans-serif] border-b border-zinc-800 flex justify-between items-center">
                    <span>Entregas Cadastradas</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-1 mt-1">
                    {deliveryOrders.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        Nenhuma entrega ativa encontrada.
                      </div>
                    ) : (
                      deliveryOrders.map((ord) => (
                        <button
                          key={ord.id}
                          onClick={() => {
                            setSearchParams({ orderId: String(ord.id) });
                            setShowOrderSelector(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer text-xs flex justify-between items-center ${
                            selectedOrder?.id === ord.id
                              ? 'bg-orange-600/20 border border-orange-500/40 text-white font-bold'
                              : 'hover:bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          <div>
                            <span className="block font-bold">#{ord.id} · {ord.customerName || 'Cliente'}</span>
                            <span className="text-[10px] text-zinc-400 truncate max-w-[180px] block">
                              {ord.deliveryAddress || 'Endereço não informado'}
                            </span>
                          </div>
                          <span className="text-amber-400 font-black">{formatPrice(ord.totalAmount)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL (SPLIT VIEW: GPS & MAPA + PAINEL DE CONTROLE DA CORRIDA) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {!selectedOrder ? (
          <ScrollReveal direction="zoom" duration={500}>
            <div className="text-center py-20 bg-[#121214] rounded-3xl border border-zinc-800 shadow-2xl p-6">
              <Bike className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-wider">
                Nenhuma corrida de entrega ativa
              </h2>
              <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                Não há pedidos de delivery ativos no momento. Assim que novos pedidos de entrega forem recebidos, eles aparecerão automaticamente aqui.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LADO ESQUERDO / CENTRAL: MAPA GPS & ROTA INTERATIVA (7 COLUNAS) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* GPS Navigation HUD (Head-Up Display Superior do Waze/iFood) */}
              <ScrollReveal direction="down" duration={500}>
                <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-lg shadow-orange-950/60 shrink-0">
                      <Navigation size={22} className="rotate-45" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-orange-400 tracking-wider font-['Oswald',sans-serif]">
                          PRÓXIMA MANOBRA
                        </span>
                        <span className="text-[10px] px-2 py-0.2 bg-zinc-800 text-zinc-400 rounded-full font-bold">
                          EM 350 METROS
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                        {driverStage === 'AT_STORE'
                          ? 'Acesse a Av. Paulista até o FoodExpress'
                          : driverStage === 'ARRIVED_AT_CLIENT'
                          ? 'Você chegou ao destino do cliente!'
                          : driverStage === 'COMPLETED'
                          ? 'Corrida finalizada com sucesso!'
                          : `Vire à direita em direção a ${clientAddress.split('-')[0]}`}
                      </h3>
                    </div>
                  </div>

                  {/* Estimativa de Tempo & Distância */}
                  <div className="text-right shrink-0">
                    <span className="text-lg sm:text-xl font-black text-amber-400 font-['Oswald',sans-serif] block leading-none">
                      {driverStage === 'ARRIVED_AT_CLIENT' || driverStage === 'COMPLETED' ? '0 min' : '8 min'}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-semibold">
                      {driverStage === 'ARRIVED_AT_CLIENT' || driverStage === 'COMPLETED' ? 'No local' : '2.1 km'}
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Visual Interactive Route Canvas / Map View */}
              <ScrollReveal direction="zoom" duration={600}>
                <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#0c0a08] shadow-2xl h-[400px] sm:h-[460px] flex flex-col justify-between p-4 group">
                  
                  {/* Background: Map Rendering Vector Style or Satellite */}
                  {mapMode === 'vector' ? (
                    <div className="absolute inset-0 bg-[#0d1117] overflow-hidden pointer-events-none select-none">
                      {/* Grid de ruas e quadras escuras estilo GPS Noturno */}
                      <svg className="w-full h-full opacity-65" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="city-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                            <rect width="100" height="100" fill="#0b0e14" />
                            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1f2937" strokeWidth="3" />
                            <rect x="15" y="15" width="70" height="70" rx="8" fill="#131b26" stroke="#1b2433" strokeWidth="1" />
                          </pattern>
                          <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f97316" />
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="glow" />
                            <feMerge>
                              <feMergeNode in="glow" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Malha urbana */}
                        <rect width="100%" height="100%" fill="url(#city-grid)" />

                        {/* Principais Avenidas de São Paulo demarcadas */}
                        <line x1="0" y1="280" x2="800" y2="120" stroke="#2a3547" strokeWidth="16" />
                        <text x="60" y="270" fill="#4b5563" fontSize="11" fontWeight="bold" transform="rotate(-11, 60, 270)">
                          AV. PAULISTA
                        </text>

                        <line x1="320" y1="0" x2="380" y2="500" stroke="#242e3d" strokeWidth="12" />
                        <text x="340" y="80" fill="#4b5563" fontSize="10" fontWeight="bold" transform="rotate(82, 340, 80)">
                          RUA AUGUSTA
                        </text>

                        <line x1="0" y1="360" x2="800" y2="360" stroke="#242e3d" strokeWidth="10" />
                        <text x="180" y="352" fill="#4b5563" fontSize="10" fontWeight="bold">
                          ALAMEDA SANTOS
                        </text>

                        {/* ROTA ATIVA ILUMINADA (Path Curvo do Restaurante ao Cliente) */}
                        <path
                          d="M 120 270 Q 260 250 350 200 T 580 140"
                          fill="none"
                          stroke="url(#route-gradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          filter="url(#glow)"
                        />

                        {/* Linha pontilhada animada */}
                        <path
                          d="M 120 270 Q 260 250 350 200 T 580 140"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeDasharray="6,8"
                          strokeLinecap="round"
                          className="animate-pulse"
                        />

                        {/* PONTO A: FOODEXPRESS RESTAURANTE (ORIGEM) */}
                        <circle cx="120" cy="270" r="14" fill="#ea580c" stroke="#ffffff" strokeWidth="3" />
                        <text x="120" y="275" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="bold">🍔</text>
                        <text x="120" y="304" fill="#f97316" fontSize="11" textAnchor="middle" fontWeight="black" fontFamily="Oswald, sans-serif">
                          FOODEXPRESS
                        </text>

                        {/* PONTO B: DESTINO DO CLIENTE */}
                        <circle cx="580" cy="140" r="14" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
                        <text x="580" y="145" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="bold">📍</text>
                        <text x="580" y="174" fill="#34d399" fontSize="11" textAnchor="middle" fontWeight="black" fontFamily="Oswald, sans-serif">
                          DESTINO CLIENTE
                        </text>

                        {/* MOTOCICLISTA EM MOVIMENTO DINÂMICO (Posicionado proporcionalmente) */}
                        <g transform={`translate(${120 + (580 - 120) * (bikePosition / 100)}, ${270 + (140 - 270) * (bikePosition / 100)})`}>
                          <circle cx="0" cy="0" r="18" fill="#fbbf24" stroke="#000000" strokeWidth="2" className="animate-ping opacity-40" />
                          <circle cx="0" cy="0" r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                          <text x="0" y="5" fill="#000000" fontSize="13" textAnchor="middle">🛵</text>
                        </g>
                      </svg>
                    </div>
                  ) : (
                    /* Satellite View via Google Maps Embed */
                    <div className="absolute inset-0">
                      <iframe
                        title="Mapa de Rota do Entregador FoodExpress"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.097782780654!2d-46.65492162386927!3d-23.565839078796853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sAv.%20Paulista%2C%201200%20-%20Bela%20Vista%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                        className="w-full h-full border-0 opacity-80"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                    </div>
                  )}

                  {/* Top Overlay Controls do Mapa */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-zinc-700 text-xs text-white font-bold uppercase font-['Oswald',sans-serif] tracking-wider shadow-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>GPS ATIVO · ROTA EM TEMPO REAL</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão de Alternância de Mapa */}
                      <button
                        onClick={() => setMapMode(mapMode === 'vector' ? 'satellite' : 'vector')}
                        className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer"
                      >
                        {mapMode === 'vector' ? 'Ver Satélite' : 'Ver Mapa Vetor'}
                      </button>

                      {/* Botão de Som da Rota */}
                      <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className="p-2 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title={audioEnabled ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros'}
                      >
                        {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Overlay: Atalhos Diretos Waze & Google Maps */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-950/50"
                      >
                        <Compass size={14} />
                        <span>Abrir no Waze</span>
                        <ExternalLink size={12} className="opacity-70" />
                      </a>

                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/50"
                      >
                        <Navigation size={14} />
                        <span>Google Maps</span>
                        <ExternalLink size={12} className="opacity-70" />
                      </a>
                    </div>

                    <div className="bg-black/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
                      <span className="text-zinc-500">Trânsito:</span>
                      <span className="text-emerald-400 font-bold">Fluido na rota</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Informações de Rota & Endereços Detalhados */}
              <ScrollReveal direction="up" delay={100} duration={600}>
                <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 shadow-xl space-y-4">
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif]">
                        Pedido Selecionado
                      </span>
                      <h4 className="text-xl font-black text-white font-['Oswald',sans-serif] tracking-tight">
                        Pedido #{selectedOrder.id}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif]">
                        Taxa do Motorista
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-['Oswald',sans-serif] block leading-none">
                        R$ 12,50
                      </span>
                    </div>
                  </div>

                  {/* Endereço de Coleta (Restaurante) */}
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-white uppercase font-['Oswald',sans-serif] tracking-wide block">
                        Ponto de Coleta (Restaurante)
                      </span>
                      <p className="text-zinc-400 leading-relaxed mt-0.5">
                        {RESTAURANT_LOCATION.name} · {RESTAURANT_LOCATION.address}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 shrink-0">
                      Balcão Expresso
                    </span>
                  </div>

                  {/* Endereço de Entrega (Cliente) */}
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-white uppercase font-['Oswald',sans-serif] tracking-wide block">
                        Ponto de Entrega (Cliente)
                      </span>
                      <p className="text-zinc-200 font-medium leading-relaxed mt-0.5">
                        {clientAddress}
                      </p>
                      <span className="text-orange-400 text-[11px] block mt-1 font-medium">
                        Observação: "Tocar interfone ou chamar no portão principal"
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* LADO DIREITO: CONTROLE OPERACIONAL DA CORRIDA, CLIENTE & ITENS (5 COLUNAS) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Stepper de Progresso da Entrega (Estilo iFood) */}
              <ScrollReveal direction="left" duration={500}>
                <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 shadow-xl">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block mb-3">
                    Progresso da Entrega
                  </span>

                  <div className="space-y-3">
                    {/* Passo 1: Coleta */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      driverStage === 'AT_STORE'
                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          driverStage !== 'AT_STORE'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-orange-600 text-white animate-pulse'
                        }`}>
                          {driverStage !== 'AT_STORE' ? <Check size={13} strokeWidth={3} /> : '1'}
                        </span>
                        <div>
                          <strong className="block text-white">Coleta no FoodExpress</strong>
                          <span className="text-[11px]">Pacote lacrado na cozinha</span>
                        </div>
                      </div>
                      {driverStage === 'AT_STORE' && (
                        <button
                          onClick={handleConfirmStorePickup}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] uppercase font-['Oswald',sans-serif] tracking-wider cursor-pointer shadow-md"
                        >
                          Pegar Bag
                        </button>
                      )}
                    </div>

                    {/* Passo 2: A Caminho */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      driverStage === 'TRANSIT_TO_CLIENT'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          driverStage === 'ARRIVED_AT_CLIENT' || driverStage === 'COMPLETED'
                            ? 'bg-emerald-500 text-black'
                            : driverStage === 'TRANSIT_TO_CLIENT'
                            ? 'bg-amber-500 text-black animate-pulse'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {driverStage === 'ARRIVED_AT_CLIENT' || driverStage === 'COMPLETED' ? (
                            <Check size={13} strokeWidth={3} />
                          ) : (
                            '2'
                          )}
                        </span>
                        <div>
                          <strong className="block text-white">Em Rota até o Destino</strong>
                          <span className="text-[11px]">Deslocamento na via</span>
                        </div>
                      </div>
                      {driverStage === 'TRANSIT_TO_CLIENT' && (
                        <button
                          onClick={handleArrivedAtClient}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] uppercase font-['Oswald',sans-serif] tracking-wider cursor-pointer shadow-md"
                        >
                          Cheguei no Local
                        </button>
                      )}
                    </div>

                    {/* Passo 3: Confirmação e Validação */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      driverStage === 'ARRIVED_AT_CLIENT'
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                        : driverStage === 'COMPLETED'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          driverStage === 'COMPLETED'
                            ? 'bg-emerald-500 text-black'
                            : driverStage === 'ARRIVED_AT_CLIENT'
                            ? 'bg-blue-500 text-white animate-pulse'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {driverStage === 'COMPLETED' ? <Check size={13} strokeWidth={3} /> : '3'}
                        </span>
                        <div>
                          <strong className="block text-white">
                            {driverStage === 'COMPLETED' ? 'Entrega Concluída' : 'Entrega ao Cliente'}
                          </strong>
                          <span className="text-[11px]">Validação do código PIN</span>
                        </div>
                      </div>
                      {driverStage === 'ARRIVED_AT_CLIENT' && (
                        <button
                          onClick={handleOpenPinModal}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase font-['Oswald',sans-serif] tracking-wider cursor-pointer shadow-md flex items-center gap-1"
                        >
                          <KeyRound size={12} />
                          Digitar PIN
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Banner de Sucesso quando finalizada */}
                  {completedSuccess && (
                    <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                      <div>
                        <strong className="block text-white font-bold">Entrega Finalizada com Sucesso!</strong>
                        <span>Pedido concluído e registrado no sistema.</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Dados do Cliente & Ações de Contato Direto */}
              <ScrollReveal direction="left" delay={100} duration={600}>
                <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 shadow-xl">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif] block mb-2">
                    Dados do Destinatário
                  </span>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-black text-white font-['Oswald',sans-serif]">
                        {selectedOrder.customerName || 'Cliente FoodExpress'}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {selectedOrder.customerPhone || 'Pedido Delivery'}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                        selectedOrder.isPaid
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}
                    >
                      {selectedOrder.isPaid ? 'Pago' : 'Cobrar na Entrega'}
                    </span>
                  </div>

                  {/* Botões Rápidos de Contato */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={clientWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/50"
                    >
                      <MessageCircle size={15} />
                      <span>WhatsApp</span>
                    </a>

                    {cleanCustomerPhone ? (
                      <a
                        href={`tel:${cleanCustomerPhone}`}
                        className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Phone size={15} />
                        <span>Ligar</span>
                      </a>
                    ) : (
                      <span className="py-2.5 px-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider flex items-center justify-center gap-2">
                        <Phone size={15} />
                        <span>Sem telefone</span>
                      </span>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              {/* Checklist de Conferência de Itens na Bag */}
              <ScrollReveal direction="left" delay={150} duration={600}>
                <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-['Oswald',sans-serif]">
                      Conferência de Itens ({selectedOrder.items?.length || 0})
                    </span>
                    <span className="text-[10px] text-zinc-500">Marque para conferir</span>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedOrder.items?.map((it) => {
                      const isChecked = !!checkedItems[it.id];
                      return (
                        <div
                          key={it.id}
                          onClick={() => toggleCheckItem(it.id)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-zinc-300'
                              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-400 text-black'
                                  : 'border-zinc-700 bg-zinc-800'
                              }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className={isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                              <strong>{it.quantity}x</strong> {it.productNameSnapshot}
                            </span>
                          </div>
                          <span className="text-amber-400 font-bold shrink-0">
                            {formatPrice(it.subtotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">Valor Total dos Produtos:</span>
                    <span className="text-base font-black text-amber-400 font-['Oswald',sans-serif]">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Botão Principal de Conclusão / PIN */}
              {driverStage === 'ARRIVED_AT_CLIENT' && (
                <button
                  onClick={handleOpenPinModal}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider font-['Oswald',sans-serif] rounded-2xl shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound size={18} />
                  <span>Finalizar Entrega com Código PIN</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. MODAL DE CONFIRMAÇÃO POR CÓDIGO PIN */}
      {showPinModal && (
        <ModalPortal
          isOpen={showPinModal}
          className="bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto scrollbar-hide overscroll-contain bg-[#121214] rounded-3xl border border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowPinModal(false)}
              className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Fechar modal PIN"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 mx-auto flex items-center justify-center">
                <KeyRound size={22} />
              </div>
              <h3 className="text-xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-wider pt-2">
                Código de Confirmação
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Peça ao cliente os 4 dígitos informados na tela de acompanhamento do FoodExpress para validar a entrega.
              </p>
            </div>

            {/* Input dos 4 dígitos */}
            <div>
              <input
                type="text"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="w-full h-14 bg-black border border-zinc-700 focus:border-orange-500 rounded-2xl text-center text-3xl font-black tracking-widest text-white outline-none"
                autoFocus
              />
              {pinError && (
                <p className="text-red-400 text-xs text-center mt-2 font-medium">
                  {pinError}
                </p>
              )}
            </div>

            {/* Ações do Modal */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeliveryPin}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/60"
              >
                Confirmar
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
