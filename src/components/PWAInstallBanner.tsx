import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { isPWAInstallable, showInstallPrompt, isPWA, isIOS } from '@/utils/pwa';

export const PWAInstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Mostrar banner apenas se PWA for instalável e não estiver já instalado
    const checkInstallability = () => {
      const shouldShow = isPWAInstallable() && !isPWA() && !localStorage.getItem('pwa-install-dismissed');
      setShowBanner(shouldShow);
    };

    // Verificar inicialmente e depois a cada mudança no prompt
    checkInstallability();
    
    // Listener para mudanças no evento beforeinstallprompt
    const handleBeforeInstallPrompt = () => {
      setTimeout(checkInstallability, 100); // Pequeno delay para garantir que o estado foi atualizado
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await showInstallPrompt();
      if (success) {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Erro na instalação:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Banner para iOS (instruções manuais)
  if (isIOS() && !isPWA() && !localStorage.getItem('pwa-install-dismissed-ios')) {
    return (
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Instale o App no seu iPhone/iPad
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Para uma melhor experiência, adicione este app à sua tela inicial:
              </p>
              <ol className="text-xs text-blue-600 space-y-1 mb-3">
                <li>1. Toque no ícone de compartilhar (⬆️) no Safari</li>
                <li>2. Selecione "Adicionar à Tela Inicial"</li>
                <li>3. Toque em "Adicionar"</li>
              </ol>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => localStorage.setItem('pwa-install-dismissed-ios', 'true')}
              className="text-blue-600 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Banner padrão para outros navegadores
  if (!showBanner) return null;

  return (
    <Card className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Download className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">
              Instalar Agenda Paroquial
            </h3>
            <p className="text-sm text-green-700">
              Instale o app para acesso rápido e experiência completa offline
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleInstall}
              disabled={isInstalling}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isInstalling ? 'Instalando...' : 'Instalar'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="text-green-600 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};