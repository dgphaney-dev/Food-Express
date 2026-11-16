import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import CustomerMenuPage from './pages/CustomerMenuPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Aplicação Exclusiva do Cliente (ACT-01)
 * Isolada do painel administrativo — nenhum link ou referência ao Admin é exibido ao cliente.
 */
export default function CustomerApp() {
  return (
    <Routes>
      {/* 1. ABA INÍCIO (Tela Demonstrativa Inicial Steakhouse) */}
      <Route path="/" element={<HomePage />} />

      {/* 2. ABA RESTAURANTE & SALÃO (Página Dedicada ao Espaço Presencial) */}
      <Route path="/restaurante" element={<RestaurantPage />} />
      <Route path="/salao" element={<Navigate to="/restaurante" replace />} />

      {/* 3. ABA NOSSOS PRODUTOS (Cardápio Completo Interativo, Sacola & Pedidos) */}
      <Route path="/nossos-produtos" element={<CustomerMenuPage />} />
      <Route path="/delivery" element={<CustomerMenuPage />} />
      <Route path="/cardapio" element={<CustomerMenuPage />} />
      <Route path="/produtos" element={<CustomerMenuPage />} />
      <Route path="/menu" element={<Navigate to="/nossos-produtos" replace />} />

      {/* 4. ACOMPANHAMENTO DE PEDIDO PELO CLIENTE (RF-011 / RF-012) */}
      <Route path="/pedido/:orderId" element={<OrderTrackingPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
