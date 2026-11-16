import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090807] text-zinc-100 flex items-center justify-center p-6 selection:bg-amber-500/20">
          <div className="max-w-md w-full bg-[#140f0c] border border-[#2b221a] rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-['Oswald',sans-serif] tracking-wide text-white uppercase mb-2">
              Algo inesperado aconteceu
            </h1>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              O sistema recuperou o estado com segurança para evitar tela em branco. Clique abaixo para recarregar ou voltar ao início.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-sm transition-all shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e1713] hover:bg-[#281f1a] border border-[#382d23] text-zinc-300 font-medium text-sm transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                Página Inicial
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
