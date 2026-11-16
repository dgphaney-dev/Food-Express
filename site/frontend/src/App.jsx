<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SmoothScroll from './components/SmoothScroll';
import LoadingScreen from './components/LoadingScreen';
import CustomerApp from './CustomerApp';
import AdminApp from '../admin/AdminApp';
=======
import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SmoothScroll from './components/SmoothScroll'
import LoadingScreen from './components/LoadingScreen'
import HomePage from './pages/HomePage'
import RestaurantPage from './pages/RestaurantPage'
import CustomerMenuPage from './pages/CustomerMenuPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import AdminLoginPage from '../admin/pages/AdminLoginPage'
import AdminMetricsPage from '../admin/pages/AdminMetricsPage'
import AdminOrdersPage from '../admin/pages/AdminOrdersPage'
import AdminMenuPage from '../admin/pages/AdminMenuPage'
import AdminUsersPage from '../admin/pages/AdminUsersPage'
import DriverDeliveryPage from './pages/DriverDeliveryPage'
import NotFoundPage from './pages/NotFoundPage'
>>>>>>> origin/main

/**
 * Orquestrador de Aplicações Isoladas (Cliente vs. Painel Administrativo via URL)
 * - Se acessado via URL de Admin (/admin*, /#/admin*, /#/entregador*), carrega exclusivamente a aplicação AdminApp.
 * - Caso contrário, carrega exclusivamente a aplicação pública do Cliente (CustomerApp), sem expor acessos administrativos.
 */
function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteChange, setIsRouteChange] = useState(false);
  const isInitialMount = useRef(true);

  // Suporte a acesso direto por pathname (ex: http://localhost:5173/admin ou /admin/login)
  useEffect(() => {
    const browserPath = window.location.pathname;
    if (
      (browserPath.startsWith('/admin') ||
        browserPath.startsWith('/entregador') ||
        browserPath.startsWith('/motorista')) &&
      !browserPath.endsWith('.html') &&
      location.pathname === '/'
    ) {
      navigate(browserPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  // Trigger loading screen whenever route changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setIsRouteChange(true);
    setIsLoading(true);
  }, [location.pathname]);

  const isAdminOrDriverApp =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/entregador') ||
    location.pathname.startsWith('/motorista') ||
    location.pathname.startsWith('/driver') ||
    window.location.pathname.startsWith('/admin');

  return (
    <>
      {isLoading && (
        <LoadingScreen
          key={location.pathname}
          isRouteChange={isRouteChange}
          onFinish={() => setIsLoading(false)}
        />
      )}
      <SmoothScroll>
<<<<<<< HEAD
        {isAdminOrDriverApp ? <AdminApp /> : <CustomerApp />}
=======
        <Routes>
          {/* 1. ABA INÍCIO (Tela Demonstrativa Inicial Outback) */}
          <Route path="/" element={<HomePage />} />

          {/* 2. ABA RESTAURANTE & SALÃO (Página Dedicada ao Espaço Presencial) */}
          <Route path="/restaurante" element={<RestaurantPage />} />
          <Route path="/salao" element={<Navigate to="/restaurante" replace />} />

          {/* 3. ABA NOSSOS PRODUTOS (Cardápio Completo Interativo, Personalizações & Pedidos) */}
          <Route path="/nossos-produtos" element={<CustomerMenuPage />} />
          <Route path="/delivery" element={<CustomerMenuPage />} />
          <Route path="/cardapio" element={<CustomerMenuPage />} />
          <Route path="/produtos" element={<CustomerMenuPage />} />
          <Route path="/menu" element={<Navigate to="/nossos-produtos" replace />} />
          <Route path="/pedido/:orderId" element={<OrderTrackingPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/pedidos" replace />} />
          <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
          <Route path="/admin/metricas" element={<AdminMetricsPage />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/metricas" replace />} />
          <Route path="/admin/cardapio" element={<AdminMenuPage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/users" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="/admin/acessos" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="/admin/equipe" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Aliases for English paths */}
          <Route path="/admin/orders" element={<Navigate to="/admin/pedidos" replace />} />
          <Route path="/admin/menu" element={<Navigate to="/admin/cardapio" replace />} />

          {/* 4. TELA DO MOTORISTA / ENTREGADOR (ESTILO IFOOD / WAZE COM GPS & ROTA) */}
          <Route path="/entregador" element={<DriverDeliveryPage />} />
          <Route path="/motorista" element={<Navigate to="/entregador" replace />} />
          <Route path="/driver" element={<Navigate to="/entregador" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
>>>>>>> origin/main
      </SmoothScroll>
    </>
  );
}

export default App;
