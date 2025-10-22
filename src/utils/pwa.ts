// Utilitários PWA
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Detectar se o PWA pode ser instalado
export const isPWAInstallable = (): boolean => {
  return deferredPrompt !== null;
};

// Capturar o evento de instalação do PWA
export const setupPWAInstall = (): void => {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
};

// Mostrar prompt de instalação
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;

    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA: Erro ao mostrar prompt:', error);
    return false;
  }
};

// Verificar se está rodando como PWA
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Verificar se está no iOS
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Verificar se pode usar notificações
export const canUseNotifications = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Solicitar permissão para notificações
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!canUseNotifications()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('PWA: Erro ao solicitar permissão de notificação:', error);
    return false;
  }
};

// Enviar notificação local
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: 'lovable-uploads/logo.png',
      badge: 'lovable-uploads/logo.png',
      ...options
    });
  }
};