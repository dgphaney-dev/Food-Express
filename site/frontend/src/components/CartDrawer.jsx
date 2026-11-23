import { useEffect, useState, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Bike,
  ShoppingBag,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/helpers';
import ModalPortal from './ModalPortal';

export default function CartDrawer({ isOpen, onClose, onCheckout }) {
  const { items, updateQuantity, removeItem, totalItems, totalPrice } = useCart();

  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX'); // 'PIX' | 'CREDIT_CARD' | 'CASH_ON_DELIVERY'
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);

  // Reseta estado do modal PIX ao fechar a sacola
  useEffect(() => {
    if (!isOpen) {
      setShowPixModal(false);
      setPaymentApproved(false);
      setIsProcessingPayment(false);
    }
  }, [isOpen]);

  // Código PIX copia e cola gerado conforme valor do pedido
  const pixCopiaECola = useMemo(
    () =>
      `00020126580014BR.GOV.BCB.PIX0136foodexpress-pix5204000053039865406${totalPrice.toFixed(
        2
      )}5802BR5920FOODEXPRESS STEAK6009SAO PAULO62070503***6304ABCD`,
    [totalPrice]
  );

  if (!isOpen) return null;

  const isEmpty = items.length === 0;
  const isDineIn = orderType === 'DINE_IN';
  const isDelivery = orderType === 'DELIVERY';

  const canProceed =
    !isEmpty &&
    ((isDineIn && tableNumber.trim() !== '') ||
      (isDelivery && customerName.trim() !== ''));

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const handleStartCheckout = () => {
    if (!canProceed) return;
    if (paymentMethod === 'PIX') {
      setShowPixModal(true);
    } else {
      // Cartão ou Dinheiro
      onCheckout({
        orderType,
        tableNumber: isDineIn ? tableNumber.trim() : null,
        customerName: isDelivery ? customerName.trim() : null,
        deliveryAddress: isDelivery ? deliveryAddress.trim() || null : null,
        paymentMethod,
        isPaid: paymentMethod === 'CREDIT_CARD',
      });
    }
  };

  // Simulação de confirmação do pagamento PIX
  const handleConfirmPixPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentApproved(true);
      setTimeout(() => {
        onCheckout({
          orderType,
          tableNumber: isDineIn ? tableNumber.trim() : null,
          customerName: isDelivery ? customerName.trim() : null,
          deliveryAddress: isDelivery ? deliveryAddress.trim() || null : null,
          paymentMethod: 'PIX',
          isPaid: true,
        });
      }, 1000);
    }, 1200);
  };

  return (
    <ModalPortal isOpen={isOpen} className="flex items-end sm:items-stretch sm:justify-end">
      {/* Backdrop bloqueador (impede acesso ao site atrás do modal) */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" />

      {/* Panel */}
      <div
        className="relative z-10 flex w-full max-w-lg sm:max-w-md flex-col rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl bg-[#14110f] border-l border-[#2d241e] text-stone-100 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 max-h-[92vh] sm:max-h-full sm:h-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26201b] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold font-['Oswald',sans-serif] uppercase tracking-wide">
              Sua Sacola ({totalItems})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-[#201b17] hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar sacola"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content sem barra de rolagem visível */}
        <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <ShoppingBag size={48} className="text-stone-600 mb-3" />
              <p className="text-base font-semibold text-stone-300">Sua sacola está vazia</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                Explore nosso cardápio artesanal e adicione seus burgers e porções favoritos.
              </p>
            </div>
          ) : (
            <div>
              {/* Items list */}
              <ul className="divide-y divide-[#241e19] px-5 py-2">
                {items.map((item) => (
                  <li key={item.cartItemId} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white font-['Oswald',sans-serif] tracking-wide">
                          {item.productName}
                        </h4>
                        {item.variationName && (
                          <span className="text-xs text-amber-500 block font-medium">
                            {item.variationName}
                          </span>
                        )}
                        {item.addonsDetail && item.addonsDetail.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.addonsDetail.map((a, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-[#221c17] text-stone-300 px-1.5 py-0.5 rounded border border-[#332922]"
                              >
                                + {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-amber-300/80 italic mt-1">
                            Obs: {item.notes}
                          </p>
                        )}
                        <span className="text-xs font-bold text-amber-400 mt-1.5 block">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              removeItem(item.cartItemId);
                            } else {
                              updateQuantity(item.cartItemId, item.quantity - 1);
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#382d24] bg-[#1a1512] text-stone-300 hover:text-white hover:border-orange-500 transition-colors cursor-pointer"
                        >
                          {item.quantity === 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={13} />}
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-white font-['Oswald',sans-serif]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500 bg-orange-600 text-white hover:bg-orange-500 transition-colors cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Order type section */}
              <div className="border-t border-[#26201b] px-5 py-5 space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400 font-['Oswald',sans-serif]">
                    1. Modalidade de Atendimento
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderType('DINE_IN')}
                      className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer ${
                        isDineIn
                          ? 'border-orange-500 bg-orange-950/40 text-orange-400 shadow-xs'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Utensils size={15} />
                      <span>Consumo no Salão</span>
                    </button>
                    <button
                      onClick={() => setOrderType('DELIVERY')}
                      className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer ${
                        isDelivery
                          ? 'border-orange-500 bg-orange-950/40 text-orange-400 shadow-xs'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Bike size={15} />
                      <span>Delivery (Entrega)</span>
                    </button>
                  </div>
                </div>

                {/* Conditional fields */}
                <div className="flex flex-col gap-3">
                  {isDineIn && (
                    <div>
                      <label htmlFor="tableNumber" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-300 font-['Oswald',sans-serif]">
                        Número da Mesa <span className="text-orange-500">*</span>
                      </label>
                      <input
                        id="tableNumber"
                        type="text"
                        inputMode="numeric"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Ex: Mesa 12"
                        className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {isDelivery && (
                    <>
                      <div>
                        <label htmlFor="customerName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-300 font-['Oswald',sans-serif]">
                          Seu Nome Completo <span className="text-orange-500">*</span>
                        </label>
                        <input
                          id="customerName"
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ex: Mariana Silva"
                          className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="deliveryAddress" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-300 font-['Oswald',sans-serif]">
                          Endereço Completo de Entrega <span className="text-orange-500">*</span>
                        </label>
                        <textarea
                          id="deliveryAddress"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Rua, número, complemento (apto/bloco), ponto de referência..."
                          rows={2}
                          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Forma de Pagamento */}
                <div className="pt-2 border-t border-[#26201b]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 font-['Oswald',sans-serif]">
                      2. Forma de Pagamento
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                      Ativação Imediata
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === 'PIX'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <QrCode size={18} className={paymentMethod === 'PIX' ? 'text-emerald-400' : 'text-zinc-400'} />
                      <span className="text-[11px] font-bold uppercase font-['Oswald',sans-serif]">PIX Rápido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-orange-500 bg-orange-950/40 text-orange-300 shadow-md ring-1 ring-orange-500/40'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard size={18} className={paymentMethod === 'CREDIT_CARD' ? 'text-orange-400' : 'text-zinc-400'} />
                      <span className="text-[11px] font-bold uppercase font-['Oswald',sans-serif]">Cartão</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Banknote size={18} className={paymentMethod === 'CASH_ON_DELIVERY' ? 'text-amber-400' : 'text-zinc-400'} />
                      <span className="text-[11px] font-bold uppercase font-['Oswald',sans-serif]">Na Entrega</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Total + checkout button */}
        {!isEmpty && (
          <div className="border-t border-[#26201b] bg-[#14110f] px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-bold text-stone-300 font-['Oswald',sans-serif] uppercase tracking-wide">
                Total a Pagar
              </span>
              <span className="text-2xl font-black text-amber-400 font-['Oswald',sans-serif] tracking-wide">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <button
              onClick={handleStartCheckout}
              disabled={!canProceed}
              className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm sm:text-base font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-md font-['Oswald',sans-serif] uppercase tracking-wider cursor-pointer ${
                paymentMethod === 'PIX'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : 'bg-orange-600 hover:bg-orange-500 shadow-orange-950/50'
              }`}
            >
              {paymentMethod === 'PIX' ? (
                <>
                  <QrCode size={18} />
                  <span>Pagar via PIX ({formatPrice(totalPrice)})</span>
                </>
              ) : (
                <>
                  <span>Finalizar Pedido — {formatPrice(totalPrice)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE PAGAMENTO PIX INSTANTÂNEO */}
      {showPixModal && (
        <ModalPortal
          isOpen={showPixModal}
          zIndexClass="z-[100010]"
          className="bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto scrollbar-hide overscroll-contain bg-[#121214] rounded-3xl border border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            {paymentApproved ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase font-['Oswald',sans-serif] tracking-wider">
                  Pagamento Confirmado!
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Seu pedido já está <strong className="text-emerald-400">ATIVO</strong> e foi enviado para a cozinha e para a rota do entregador!
                </p>
                <div className="pt-2">
                  <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode size={20} className="text-emerald-400" />
                    <h3 className="text-base font-black text-white uppercase font-['Oswald',sans-serif] tracking-wider">
                      Pagamento via PIX
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPixModal(false)}
                    className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                    aria-label="Fechar modal PIX"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Valor */}
                <div className="text-center p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] uppercase font-bold text-zinc-400 font-['Oswald',sans-serif] tracking-wider block">
                    Valor a Transferir
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-['Oswald',sans-serif]">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {/* QR Code PIX */}
                <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center relative shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCopiaECola)}`}
                    alt="QR Code Pix FoodExpress"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Copia e Cola */}
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 uppercase font-['Oswald',sans-serif] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {pixCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{pixCopied ? 'Código PIX Copiado!' : 'Copiar Chave PIX (Copia e Cola)'}</span>
                </button>

                {/* Status aguardando */}
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Aguardando confirmação bancária instantânea...</span>
                </div>

                {/* Botão de Confirmação */}
                <button
                  type="button"
                  onClick={handleConfirmPixPayment}
                  disabled={isProcessingPayment}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/60"
                >
                  {isProcessingPayment ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirmar Pagamento do PIX (Ativar Pedido)</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </ModalPortal>
      )}
    </ModalPortal>
  );
}
