import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SmoothScroll from './components/SmoothScroll';
import LoadingScreen from './components/LoadingScreen';
import CustomerApp from './CustomerApp';
import AdminApp from '../admin/AdminApp';

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
        {isAdminOrDriverApp ? <AdminApp /> : <CustomerApp />}
      </SmoothScroll>
    </>
  );
}

export default App;
