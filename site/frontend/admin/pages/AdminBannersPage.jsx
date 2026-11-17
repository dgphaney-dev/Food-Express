import { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Image,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/adminApi';

const DEFAULT_BANNER_FORM = {
  title: '',
  subtitle: '',
  badge: 'EXPERIÊNCIA EXCLUSIVA FOODEXPRESS',
  tag: 'AGORA TEM O VERDADEIRO SABOR DA BRASA',
  schedule: 'TERÇA A DOMINGO DAS 18H00 ÀS 23H30 · SALÃO & DELIVERY',
  ctaText: 'VER CARDÁPIO COMPLETO',
  ctaSubtext: 'FAZER MEU PEDIDO AGORA',
  photoUrl: '',
  photoAlt: '',
  active: true,
  sortOrder: 1,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null); // null = Criando novo
  const [formData, setFormData] = useState(DEFAULT_BANNER_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Carregar banners do backend
  const loadBanners = useCallback(async () => {
    try {
      const data = await adminApi.fetchBanners();
      if (data && Array.isArray(data.banners)) {
        setBanners(data.banners);
      }
    } catch (err) {
      // Ignora erro em mock
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const showToast = (type, text) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      ...DEFAULT_BANNER_FORM,
      sortOrder: (banners.length || 0) + 1,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
      tag: banner.tag || '',
      schedule: banner.schedule || '',
      ctaText: banner.ctaText || 'VER CARDÁPIO COMPLETO',
      ctaSubtext: banner.ctaSubtext || '',
      photoUrl: banner.photoUrl || '',
      photoAlt: banner.photoAlt || '',
      active: Boolean(banner.active),
      sortOrder: banner.sortOrder ?? 1,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (formSubmitting) return;
    setModalOpen(false);
    setEditingBanner(null);
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('O título do banner é obrigatório.');
      return;
    }

    if (!formData.photoUrl.trim()) {
      setFormError('A URL da foto do banner é obrigatória.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingBanner) {
        // Atualizar
        const res = await adminApi.updateBanner(editingBanner.id, formData);
        showToast('success', `Banner "${formData.title}" atualizado com sucesso!`);
      } else {
        // Criar novo
        const res = await adminApi.createBanner(formData);
        showToast('success', `Novo banner "${formData.title}" criado com sucesso!`);
      }
      setModalOpen(false);
      await loadBanners();
    } catch (err) {
      setFormError(err.message || 'Falha ao salvar banner. Tente novamente.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const nextActive = !banner.active;
      await adminApi.toggleBannerActive(banner.id, nextActive);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: nextActive } : b))
      );
      showToast(
        'success',
        `Banner "${banner.title}" agora está ${nextActive ? 'ATIVO' : 'DESATIVADO'}.`
      );
    } catch (err) {
      showToast('error', 'Falha ao alterar status do banner.');
    }
  };

  const handleDeleteBanner = async (banner) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o banner "${banner.title}" do carrossel?`
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteBanner(banner.id);
      showToast('success', `Banner "${banner.title}" excluído.`);
      await loadBanners();
    } catch (err) {
      showToast('error', 'Falha ao excluir banner.');
    }
  };

  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Deseja restaurar os 3 banners padrão do Steakhouse (Cortes Nobres, Aussie Fries e Thunder Brownie)?'
      )
    ) {
      return;
    }

    try {
      await adminApi.resetDefaultBanners();
      showToast('success', 'Banners originais do Steakhouse restaurados com sucesso!');
      await loadBanners();
    } catch (err) {
      showToast('error', 'Falha ao restaurar padrões.');
    }
  };

  const activeCount = banners.filter((b) => b.active).length;

  return (
    <AdminLayout
      title="Banners do Hero"
      subtitle="Gerencie em tempo real as fotos, textos e chamadas do carrossel principal da página inicial"
      onRefresh={loadBanners}
      refreshing={refreshing}
    >
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-[#14120e] border-amber-500/40 text-amber-300'
              : 'bg-[#19100e] border-red-500/40 text-red-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={17} className="text-amber-400 shrink-0" />
          ) : (
            <AlertCircle size={17} className="text-red-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Top Control Bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#120f0d] border border-[#2b221c] shadow-lg">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-['Oswald',sans-serif]">
                Total de Banners
              </span>
              <p className="text-2xl font-black text-white font-['Oswald',sans-serif]">
                {banners.length}
              </p>
            </div>
            <div className="h-8 w-px bg-[#2b221c]" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-['Oswald',sans-serif]">
                Ativos no Site
              </span>
              <p className="text-2xl font-black text-amber-400 font-['Oswald',sans-serif]">
                {activeCount}
              </p>
            </div>
            <div className="h-8 w-px bg-[#2b221c]" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-['Oswald',sans-serif]">
                Carrossel
              </span>
              <p className="text-xs text-stone-300 mt-1">
                Gira a cada 6s na página inicial
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1411] hover:bg-[#251d18] border border-[#382b22] text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] transition-all cursor-pointer active:scale-95"
              title="Restaura os slides originais do restaurante"
            >
              <RotateCcw size={14} className="text-amber-500" />
              <span>Restaurar Padrões</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="btn-luxury inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider font-['Oswald',sans-serif] shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Novo Banner</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-[#14100e] border border-[#2b221c] animate-pulse"
              />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#14100e] border border-[#2b221c] space-y-4">
            <Flame size={40} className="mx-auto text-amber-500 opacity-60" />
            <h3 className="text-lg font-bold text-white uppercase font-['Oswald',sans-serif]">
              Nenhum Banner Cadastrado
            </h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              Clique em "Novo Banner" para cadastrar um slide promocional ou em
              "Restaurar Padrões" para carregar os slides oficiais.
            </p>
          </div>
        ) : (
          /* List of Banners */
          <div className="grid grid-cols-1 gap-5">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  banner.active
                    ? 'bg-[#14100e] border-[#382b22] hover:border-amber-500/50 shadow-xl'
                    : 'bg-[#100d0b] border-[#221a15] opacity-65'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 items-center">
                  {/* Photo Preview Thumbnail */}
                  <div className="md:col-span-4 lg:col-span-3 relative h-40 rounded-xl overflow-hidden bg-black/60 border border-[#2b221c] shrink-0 group">
                    <img
                      src={banner.photoUrl}
                      alt={banner.photoAlt || banner.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Order Badge */}
                    <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-[#3d2e24] text-[10px] font-bold text-amber-400 font-['Oswald',sans-serif]">
                      <span>SLIDE #{banner.sortOrder || index + 1}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-['Oswald',sans-serif] tracking-wider ${
                          banner.active
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80'
                            : 'bg-zinc-900/90 text-zinc-400 border border-zinc-700/80'
                        }`}
                      >
                        {banner.active ? '● Ativo no Site' : '○ Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Banner Content Details */}
                  <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {banner.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 font-['Oswald',sans-serif]">
                            {banner.badge}
                          </span>
                        )}
                        {banner.tag && (
                          <>
                            <span className="text-stone-600">•</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                              {banner.tag}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white font-['Oswald',sans-serif] uppercase tracking-wide">
                        {banner.title}
                      </h3>

                      <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                        {banner.subtitle}
                      </p>

                      {banner.schedule && (
                        <p className="text-[11px] text-amber-400/90 font-mono">
                          {banner.schedule}
                        </p>
                      )}
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#241c17]">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <span className="text-stone-500">Botão CTA:</span>
                        <span className="font-bold text-amber-400 font-['Oswald',sans-serif] uppercase tracking-wider">
                          {banner.ctaText || 'VER CARDÁPIO COMPLETO'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(banner)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-['Oswald',sans-serif] uppercase tracking-wider transition-all cursor-pointer ${
                            banner.active
                              ? 'bg-[#181310] hover:bg-[#221b16] text-stone-300 border border-[#33261d]'
                              : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                          }`}
                          title={banner.active ? 'Desativar slide' : 'Ativar slide'}
                        >
                          {banner.active ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{banner.active ? 'Ocultar' : 'Publicar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(banner)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1411] hover:bg-[#261e18] text-amber-400 hover:text-amber-300 border border-[#3a2c22] text-xs font-bold font-['Oswald',sans-serif] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 text-xs font-bold font-['Oswald',sans-serif] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-[#14100e] border border-[#382b22] shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#2b221c] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Flame size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-['Oswald',sans-serif] tracking-wide">
                    {editingBanner ? 'Editar Banner do Hero' : 'Novo Banner do Hero'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Preencha as informações do slide exibido na página inicial
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={formSubmitting}
                className="p-1 rounded-lg hover:bg-[#221b16] text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-900/60 text-red-300 text-xs">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Título Principal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                  Título Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Thunder Brownie com Sorvete"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none"
                />
              </div>

              {/* Subtítulo / Descrição */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                  Descrição / Subtítulo
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Brownie quente de chocolate denso com cobertura de ganache artesanal..."
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none resize-none"
                />
              </div>

              {/* Grid: Selo Superior e Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                    Selo Superior (Dourado)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: DOCE ENCERRAMENTO DA NOITE"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                    Tagline de Destaque
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: A EXPERIÊNCIA COMPLETA DO STEAKHOUSE"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({ ...formData, tag: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tarjeta Inferior / Horário */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                  Tarjeta de Horário / Subinformação
                </label>
                <input
                  type="text"
                  placeholder="Ex: TERÇA A DOMINGO DAS 18H00 ÀS 23H30 · SALÃO & DELIVERY"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none"
                />
              </div>

              {/* URL da Foto e Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                  URL da Foto (HD) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={formData.photoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, photoUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none"
                  />
                </div>
                {formData.photoUrl && (
                  <div className="mt-2 relative h-32 rounded-xl overflow-hidden border border-[#2e241c] bg-black">
                    <img
                      src={formData.photoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-stone-300 font-bold">
                      Preview da Foto
                    </div>
                  </div>
                )}
              </div>

              {/* Grid: Botão CTA e Ordem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                    Texto do Botão de Ação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: VER CARDÁPIO COMPLETO"
                    value={formData.ctaText}
                    onChange={(e) =>
                      setFormData({ ...formData, ctaText: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 font-['Oswald',sans-serif]">
                    Ordem de Exibição (Slide #)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0c0a] border border-[#2e241c] text-white text-sm focus:border-amber-500/70 focus:outline-none"
                  />
                </div>
              </div>

              {/* Switch Ativo */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <label
                  htmlFor="activeCheck"
                  className="text-xs text-stone-300 font-bold uppercase tracking-wider font-['Oswald',sans-serif] cursor-pointer"
                >
                  Publicar banner imediatamente no carrossel da home
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2b221c]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={formSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-[#1b1512] hover:bg-[#251d18] text-stone-300 text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-luxury px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold uppercase tracking-wider font-['Oswald',sans-serif] shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Salvando...'
                    : editingBanner
                    ? 'Atualizar Banner'
                    : 'Criar Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
