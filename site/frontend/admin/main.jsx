import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { OrderProvider } from '../src/contexts/OrderContext';
import { CartProvider } from '../src/contexts/CartContext';
import SmoothScroll from '../src/components/SmoothScroll';
import ErrorBoundary from '../src/components/ErrorBoundary';
import AdminApp from './AdminApp';
import '../src/index.css';

createRoot(document.getElementById('admin-root')).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <OrderProvider>
          <CartProvider>
            <ErrorBoundary>
              <SmoothScroll>
                <AdminApp />
              </SmoothScroll>
            </ErrorBoundary>
          </CartProvider>
        </OrderProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
