import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminMetricsPage from './pages/AdminMetricsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminMenuPage from './pages/AdminMenuPage';
import DriverDeliveryPage from '../src/pages/DriverDeliveryPage';

/**
 * Aplicação Exclusiva do Painel Administrativo e Operacional (ACT-02)
 * Acessada exclusivamente via URL (/admin, /#/admin, /#/admin/login, /#/admin/pedidos, /#/admin/cardapio, /#/admin/metricas)
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

      {/* Rotas Canônicas do Painel Administrativo */}
      <Route path="/admin" element={<Navigate to="/admin/pedidos" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
      <Route path="/admin/metricas" element={<AdminMetricsPage />} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin/metricas" replace />} />
      <Route path="/admin/cardapio" element={<AdminMenuPage />} />

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
