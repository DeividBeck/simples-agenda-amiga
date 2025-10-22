import { useState, useEffect } from 'react';
import { 
  isPWAInstallable, 
  isPWA, 
  isIOS,
  canUseNotifications,
  requestNotificationPermission,
  showNotification 
} from '@/utils/pwa';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  supportsNotifications: boolean;
  notificationsEnabled: boolean;
}

export const usePWA = () => {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    supportsNotifications: false,
    notificationsEnabled: false
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updatePWAState = () => {
      setPWAState({
        isInstallable: isPWAInstallable(),
        isInstalled: isPWA(),
        isIOS: isIOS(),
        supportsNotifications: canUseNotifications(),
        notificationsEnabled: Notification.permission === 'granted'
      });
    };

    // Estado inicial
    updatePWAState();

    // Listeners para mudanças
    const handleBeforeInstallPrompt = () => {
      setTimeout(updatePWAState, 100);
    };

    const handleAppInstalled = () => {
      setTimeout(updatePWAState, 100);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const enableNotifications = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setPWAState(prev => ({ ...prev, notificationsEnabled: granted }));
      return granted;
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (pwaState.notificationsEnabled) {
      showNotification(title, options);
    }
  };

  return {
    ...pwaState,
    isLoading,
    enableNotifications,
    sendNotification
  };
};