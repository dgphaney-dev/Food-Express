import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminMetricsPage from './pages/AdminMetricsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminMenuPage from './pages/AdminMenuPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminBannersPage from './pages/AdminBannersPage';
import DriverDeliveryPage from '../src/pages/DriverDeliveryPage';

/**
 * Aplicação Exclusiva do Painel Administrativo e Operacional (ACT-02)
 * Acessada exclusivamente via URL (/admin, /#/admin, /#/admin/login, /#/admin/pedidos, /#/admin/cardapio, /#/admin/banners, /#/admin/metricas, /#/admin/usuarios)
 */
export default function AdminApp() {
  return (
    <Routes>
      {/* Redirecionamento raiz quando acessado via /admin.html ou /admin */}
      <Route path="/" element={<Navigate to="/admin/pedidos" replace />} />
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/pedidos" element={<Navigate to="/admin/pedidos" replace />} />
      <Route path="/metricas" element={<Navigate to="/admin/metricas" replace />} />
      <Route path="/cardapio" element={<Navigate to="/admin/cardapio" replace />} />
      <Route path="/banners" element={<Navigate to="/admin/banners" replace />} />
      <Route path="/usuarios" element={<Navigate to="/admin/usuarios" replace />} />

      {/* Rotas Canônicas do Painel Administrativo */}
      <Route path="/admin" element={<Navigate to="/admin/pedidos" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
      <Route path="/admin/metricas" element={<AdminMetricsPage />} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin/metricas" replace />} />
      <Route path="/admin/cardapio" element={<AdminMenuPage />} />
      <Route path="/admin/banners" element={<AdminBannersPage />} />
      <Route path="/admin/slides" element={<Navigate to="/admin/banners" replace />} />
      <Route path="/admin/usuarios" element={<AdminUsersPage />} />
      <Route path="/admin/users" element={<Navigate to="/admin/usuarios" replace />} />
      <Route path="/admin/acessos" element={<Navigate to="/admin/usuarios" replace />} />
      <Route path="/admin/equipe" element={<Navigate to="/admin/usuarios" replace />} />

      {/* Aliases em Inglês */}
      <Route path="/admin/orders" element={<Navigate to="/admin/pedidos" replace />} />
      <Route path="/admin/menu" element={<Navigate to="/admin/cardapio" replace />} />

      {/* Módulo Operacional do Entregador / Motorista */}
      <Route path="/entregador" element={<DriverDeliveryPage />} />
      <Route path="/motorista" element={<Navigate to="/entregador" replace />} />
      <Route path="/driver" element={<Navigate to="/entregador" replace />} />

      {/* Fallback Admin */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
