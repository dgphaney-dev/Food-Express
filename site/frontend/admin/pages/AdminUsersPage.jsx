import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  X,
  Edit2,
  Trash2,
  KeyRound,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChefHat,
  Bike,
  UtensilsCrossed,
  RefreshCw,
  Lock,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../../src/contexts/AuthContext';
import ScrollReveal from '../../src/components/ScrollReveal';
import ModalPortal from '../../src/components/ModalPortal';

const ROLES_INFO = {
  ADMIN: {
    label: 'Administrador',
    shortLabel: 'Admin',
    badgeClass: 'bg-[#1c1815] text-amber-400 border-[#3d322a]',
    icon: Shield,
    desc: 'Acesso total: métricas, cardápio, pedidos e equipe',
  },
  ATENDENTE: {
    label: 'Atendente / Salão',
    shortLabel: 'Atendente',
    badgeClass: 'bg-[#161311] text-stone-300 border-[#2b241f]',
    icon: UtensilsCrossed,
    desc: 'Operação de mesas, recebimento e comandas',
  },
  COZINHA: {
    label: 'Cozinha / KDS',
    shortLabel: 'Cozinha',
    badgeClass: 'bg-[#161311] text-stone-300 border-[#2b241f]',
    icon: ChefHat,
    desc: 'Esteira de preparo e finalização de pratos',
  },
  ENTREGADOR: {
    label: 'Motorista / Entregador',
    shortLabel: 'Entregador',
    badgeClass: 'bg-[#161311] text-stone-300 border-[#2b241f]',
    icon: Bike,
    desc: 'Logística de delivery, rotas e confirmação de PIN',
  },
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user: currentLoggedUser, isAuthenticated, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = Criando novo
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'ATENDENTE',
    phone: '',
    active: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Carregar usuários do backend (SQLite)
  const loadUsers = useCallback(async () => {
    try {
      const data = await adminApi.fetchUsers();
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
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
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated, loadUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const showFeedback = (text, type = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Abrir modal para novo usuário
  const handleOpenNewModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'ATENDENTE',
      phone: '',
      active: true,
    });
    setFormError('');
    setModalOpen(true);
  };

  // Abrir modal para editar usuário
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      password: '', // Deixa vazio se não quiser alterar
      role: user.role || 'ATENDENTE',
      phone: user.phone || '',
      active: user.active !== false,
    });
    setFormError('');
    setModalOpen(true);
  };

  // Salvar usuário (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (!formData.username.trim()) {
        throw new Error('O nome de usuário é obrigatório.');
      }

      if (!editingUser && (!formData.password || formData.password.length < 6)) {
        throw new Error('A senha é obrigatória e deve ter no mínimo 6 caracteres.');
      }

      if (editingUser && formData.password && formData.password.length < 6) {
        throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
      }

      if (editingUser) {
        // Atualizar usuário existente
        const payload = {
          name: formData.name,
          username: formData.username,
          role: formData.role,
          phone: formData.phone,
          active: formData.active,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        await adminApi.updateUser(editingUser.id, payload);
        showFeedback(`Usuário "${formData.name || formData.username}" atualizado com sucesso no banco de dados!`);
      } else {
        // Criar novo usuário
        await adminApi.createUser({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          active: formData.active,
        });
        showFeedback(`Usuário "${formData.name || formData.username}" cadastrado com sucesso no banco de dados!`);
      }

      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      setFormError(err.message || 'Falha ao salvar usuário no banco de dados.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Alternar ativo/inativo
  const handleToggleActive = async (user) => {
    try {
      await adminApi.toggleUserActive(user.id);
      showFeedback(`Status do usuário @${user.username} alterado para ${user.active ? 'Inativo' : 'Ativo'}.`);
      await loadUsers();
    } catch (err) {
      showFeedback(err.message || 'Erro ao alterar status do usuário.', 'error');
    }
  };

  // Excluir usuário
  const handleDeleteUser = async (user) => {
    const isSelf = currentLoggedUser?.id === user.id || currentLoggedUser?.username === user.username;
    if (isSelf) {
      showFeedback('Você não pode excluir sua própria conta conectada.', 'error');
      return;
    }

    const confirmMsg = `Tem certeza de que deseja remover o usuário "${user.name || user.username}" (@${user.username}) do sistema?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.deleteUser(user.id);
      showFeedback(`Usuário @${user.username} removido com sucesso.`);
      await loadUsers();
    } catch (err) {
      showFeedback(err.message || 'Erro ao remover usuário.', 'error');
    }
  };

  // Filtros de listagem
  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (roleFilter !== 'ALL') {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q))
      );
    }

    return list;
  }, [users, roleFilter, searchQuery]);

  // Contadores
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const attendantCount = users.filter((u) => u.role === 'ATENDENTE').length;

  if (!isAuthenticated) return null;

  return (
    <AdminLayout
      title="Equipe & Acessos"
      subtitle="Cadastro e controle de perfis de operadores, cozinha e entregadores (SQLite)"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="w-full space-y-6">
        {/* ================= ALERTA DE FEEDBACK ================= */}
        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all animate-fade-in ${
              feedbackMessage.type === 'error'
                ? 'bg-[#181210] border-[#3d2420] text-stone-200'
                : 'bg-[#141210] border-[#382f28] text-stone-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackMessage.type === 'error' ? (
                <AlertCircle size={16} className="text-stone-400 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="p-1 text-stone-500 hover:text-stone-300 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ================= CARDS DE RESUMO (SÓBRIOS MONOCROMÁTICOS) ================= */}
        <ScrollReveal direction="up" duration={500}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#12100d] border border-[#26201b]">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Total na Equipe
                </span>
                <Users size={16} className="text-stone-500" />
              </div>
              <div className="text-2xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1">
                {totalUsers}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Contas registradas</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#12100d] border border-[#26201b]">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Acessos Ativos
                </span>
                <UserCheck size={16} className="text-stone-500" />
              </div>
              <div className="text-2xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1">
                {activeCount}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Sessões liberadas</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#12100d] border border-[#26201b]">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Administradores
                </span>
                <Shield size={16} className="text-amber-500/80" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-['Oswald',sans-serif] mt-1">
                {adminCount}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Gestores gerais</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#12100d] border border-[#26201b]">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-['Oswald',sans-serif]">
                  Atendentes
                </span>
                <UtensilsCrossed size={16} className="text-stone-500" />
              </div>
              <div className="text-2xl font-black text-stone-100 font-['Oswald',sans-serif] mt-1">
                {attendantCount}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Salão & balcão</p>
            </div>
          </div>
        </ScrollReveal>

        {/* ================= BARRA DE CONTROLE & AÇÕES ================= */}
        <ScrollReveal direction="up" delay={60} duration={600}>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12100d] border border-[#26201b]">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, @usuário ou telefone..."
                className="w-full bg-[#0b0908] border border-[#26201b] rounded-xl pl-9 pr-9 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtros de Perfil */}
            <div className="flex items-center gap-1 bg-[#0b0908] p-1 rounded-xl border border-[#26201b] overflow-x-auto">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer shrink-0 ${
                  roleFilter === 'ALL'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer shrink-0 ${
                  roleFilter === 'ADMIN'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRoleFilter('ATENDENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer shrink-0 ${
                  roleFilter === 'ATENDENTE'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Atendente
              </button>
              <button
                onClick={() => setRoleFilter('COZINHA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer shrink-0 ${
                  roleFilter === 'COZINHA'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Cozinha
              </button>
              <button
                onClick={() => setRoleFilter('ENTREGADOR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider transition-colors cursor-pointer shrink-0 ${
                  roleFilter === 'ENTREGADOR'
                    ? 'bg-[#221c17] text-amber-400 border border-[#3d322a]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Entregador
              </button>
            </div>

            {/* Botão Novo Usuário Sóbrio Steakhouse */}
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f1915] hover:bg-[#2a221d] text-amber-400 hover:text-amber-300 border border-[#3d322a] hover:border-[#524338] font-bold text-xs uppercase font-['Oswald',sans-serif] tracking-wider transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm"
            >
              <UserPlus size={15} />
              <span>Novo Usuário</span>
            </button>
          </div>
        </ScrollReveal>

        {/* ================= TABELA DE USUÁRIOS (DADOS REAIS SQLITE) ================= */}
        <ScrollReveal direction="up" delay={100} duration={600}>
          <div className="p-6 rounded-2xl bg-[#12100d] border border-[#26201b]">
            <div className="flex items-center justify-between pb-4 border-b border-[#26201b] mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-400" />
                <h2 className="text-base font-bold uppercase font-['Oswald',sans-serif] text-stone-100 tracking-wide">
                  Usuários e Credenciais do Sistema
                </h2>
              </div>
              <span className="text-[10px] text-stone-500 font-bold uppercase font-['Oswald',sans-serif]">
                Banco de Dados SQLite (Tabela users)
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-stone-500">
                <RefreshCw size={24} className="animate-spin mx-auto text-amber-500 mb-2" />
                <span className="text-xs">Carregando usuários do banco SQLite...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1f1a16] text-[10px] font-bold uppercase font-['Oswald',sans-serif] text-stone-500">
                      <th className="py-3 px-3">Usuário</th>
                      <th className="py-3 px-3">Perfil de Acesso</th>
                      <th className="py-3 px-3">Contato</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Criado em</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181411]">
                    {filteredUsers.map((user) => {
                      const roleConfig = ROLES_INFO[user.role] || ROLES_INFO.ATENDENTE;
                      const RoleIcon = roleConfig.icon;
                      const isSelf = currentLoggedUser?.username === user.username;

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-[#181411]/60 transition-colors group"
                        >
                          {/* Coluna 1: Nome & Username */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#1c1714] border border-[#2e2520] flex items-center justify-center text-amber-400 font-bold uppercase font-['Oswald',sans-serif] text-sm shrink-0">
                                {user.name ? user.name.charAt(0) : user.username.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-100 text-xs truncate">
                                    {user.name || user.username}
                                  </span>
                                  {isSelf && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold uppercase font-['Oswald',sans-serif]">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-stone-500 block font-mono">
                                  @{user.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Coluna 2: Perfil de Acesso */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase font-['Oswald',sans-serif] tracking-wider ${roleConfig.badgeClass}`}
                              title={roleConfig.desc}
                            >
                              <RoleIcon size={13} />
                              <span>{roleConfig.label}</span>
                            </span>
                          </td>

                          {/* Coluna 3: Telefone */}
                          <td className="py-3.5 px-3 text-stone-400 text-xs">
                            {user.phone ? (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Phone size={12} className="text-stone-500" />
                                {user.phone}
                              </span>
                            ) : (
                              <span className="text-stone-600 italic">Não informado</span>
                            )}
                          </td>

                          {/* Coluna 4: Status Sóbrio */}
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase font-['Oswald',sans-serif] transition-colors cursor-pointer border ${
                                user.active
                                  ? 'bg-[#181411] text-stone-200 border-[#2e2621] hover:border-[#42362f]'
                                  : 'bg-[#12100e] text-stone-500 border-[#201b17] hover:border-[#2f2722]'
                              }`}
                              title="Clique para alternar o status do usuário"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  user.active ? 'bg-amber-400' : 'bg-stone-600'
                                }`}
                              />
                              <span>{user.active ? 'Ativo' : 'Inativo'}</span>
                            </button>
                          </td>

                          {/* Coluna 5: Data */}
                          <td className="py-3.5 px-3 text-stone-500 font-mono text-[11px]">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : '--'}
                          </td>

                          {/* Coluna 6: Ações */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-[#1f1a16] transition-colors cursor-pointer"
                                title="Editar usuário e credenciais"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={isSelf}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isSelf ? 'Você não pode se excluir' : 'Excluir usuário do sistema'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-stone-500">
                Nenhum usuário encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ================= MODAL DE CADASTRO / EDIÇÃO ================= */}
        {modalOpen && (
          <ModalPortal
            isOpen={modalOpen}
            className="flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          >
            <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-[#12100d] border border-[#2e2520] shadow-2xl relative">
              {/* Cabeçalho fixo do Modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#26201b] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1c1714] border border-[#382f28] text-amber-400 flex items-center justify-center">
                    {editingUser ? <Edit2 size={18} /> : <UserPlus size={18} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase font-['Oswald',sans-serif] text-white">
                      {editingUser ? 'Editar Acesso do Usuário' : 'Cadastrar Novo Usuário'}
                    </h3>
                    <p className="text-xs text-stone-400">
                      {editingUser
                        ? 'Atualize os dados e permissões no banco SQLite'
                        : 'Crie uma nova credencial de acesso ao sistema FoodExpress'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain p-6">
              {/* Erro de Validação */}
              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-[#1a1311] border border-[#3d2722] text-stone-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-amber-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-bold uppercase font-['Oswald',sans-serif] text-stone-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Juliana Rocha"
                    className="w-full bg-[#0b0908] border border-[#26201b] rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Grid Usuário + Telefone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase font-['Oswald',sans-serif] text-stone-300 mb-1">
                      Login / Usuário <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          username: e.target.value.toLowerCase().replace(/\s+/g, ''),
                        })
                      }
                      placeholder="Ex: juliana.atendente"
                      required
                      className="w-full bg-[#0b0908] border border-[#26201b] rounded-xl px-3 py-2 text-xs text-stone-100 font-mono placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-stone-500">Sem espaços e em minúsculas</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase font-['Oswald',sans-serif] text-stone-300 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-[#0b0908] border border-[#26201b] rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-bold uppercase font-['Oswald',sans-serif] text-stone-300 mb-1">
                    {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso *'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? '••••••••' : 'Mínimo de 6 caracteres'}
                      required={!editingUser}
                      className="w-full bg-[#0b0908] border border-[#26201b] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  </div>
                  <span className="text-[10px] text-stone-500">
                    Criptografia irreversível via Scrypt + Salt armazenada no SQLite
                  </span>
                </div>

                {/* Perfil de Acesso */}
                <div>
                  <label className="block text-xs font-bold uppercase font-['Oswald',sans-serif] text-stone-300 mb-1.5">
                    Perfil de Acesso / Nível de Permissão
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ROLES_INFO).map(([roleKey, info]) => {
                      const Icon = info.icon;
                      const selected = formData.role === roleKey;
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: roleKey })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            selected
                              ? 'bg-amber-500/10 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                              : 'bg-[#0b0908] border-[#26201b] hover:border-[#382f28]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon size={14} className={selected ? 'text-amber-400' : 'text-stone-400'} />
                            <span
                              className={`text-xs font-bold uppercase font-['Oswald',sans-serif] ${
                                selected ? 'text-amber-300' : 'text-stone-200'
                              }`}
                            >
                              {info.shortLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 line-clamp-2 leading-tight">
                            {info.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Ativo */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0908] border border-[#26201b]">
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">
                      Acesso Liberado (Ativo)
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Permitir que este usuário faça login no sistema
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#26201b]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase font-['Oswald',sans-serif] text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase font-['Oswald',sans-serif] tracking-wider bg-[#1f1915] hover:bg-[#2a221d] text-amber-400 hover:text-amber-300 border border-[#3d322a] hover:border-[#524338] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting
                      ? 'Salvando...'
                      : editingUser
                      ? 'Salvar Alterações'
                      : 'Cadastrar no SQLite'}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </AdminLayout>
  );
}
