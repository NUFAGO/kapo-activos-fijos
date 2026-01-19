import React from 'react';

/**
 * Utilidades para detección y manejo de actualizaciones del Service Worker
 * Permite notificar al usuario sobre nuevas versiones disponibles
*/

interface SWUpdateState {
  hasUpdate: boolean;
  registration?: ServiceWorkerRegistration;
  isUpdating: boolean;
}

class SWUpdateManager {
  private state: SWUpdateState = {
    hasUpdate: false,
    isUpdating: false,
  };

  private listeners: Set<(state: SWUpdateState) => void> = new Set();

  constructor() {
    // Solo configurar listeners en el cliente
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.checkForUpdates();
    }
  }

  /**
   * Suscribirse a cambios de estado
   */
  subscribe(listener: (state: SWUpdateState) => void): () => void {
    this.listeners.add(listener);
    // Notificar estado actual inmediatamente
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Obtener estado actual
   */
  getState(): SWUpdateState {
    return { ...this.state };
  }

  /**
   * Verificar actualizaciones manualmente
   */
  async checkForUpdates(): Promise<void> {
    if (this.state.isUpdating) return;

    try {
      this.state.isUpdating = true;
      this.notify();

      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        this.state = { hasUpdate: false, isUpdating: false };
        this.notify();
        return;
      }

      // Forzar check de updates
      await registration.update();

      // Verificar si hay SW esperando
      const hasUpdate = !!registration.waiting;

      this.state = {
        hasUpdate,
        registration: hasUpdate ? registration : undefined,
        isUpdating: false,
      };

      this.notify();

      if (hasUpdate) {
        console.log('[SW Update] New version available');
      } else {
        console.log('[SW Update] No updates available');
      }

    } catch (error) {
      console.error('[SW Update] Error checking for updates:', error);
      this.state.isUpdating = false;
      this.notify();
    }
  }

  /**
   * Aplicar actualización
   */
  async applyUpdate(): Promise<void> {
    if (!this.state.registration?.waiting) {
      console.warn('[SW Update] No update to apply');
      return;
    }

    try {
      console.log('[SW Update] Applying update...');

      // Notificar al SW que tome control inmediatamente
      this.state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // El evento 'controllerchange' se disparará cuando el nuevo SW tome control
      // Esto causará un reload automático

    } catch (error) {
      console.error('[SW Update] Error applying update:', error);
    }
  }

  /**
   * Posponer actualización (descartar)
   */
  dismissUpdate(): void {
    console.log('[SW Update] Update dismissed by user');
    this.state.hasUpdate = false;
    this.state.registration = undefined;
    this.notify();
  }

  /**
   * Configurar event listeners para detectar updates automáticamente
   */
  private setupEventListeners(): void {
    // Solo en el cliente
    if (typeof window === 'undefined') return;

    // Detectar cuando hay un nuevo SW disponible
    window.addEventListener('sw-update-available', ((event: CustomEvent) => {
      const { registration } = event.detail;
      console.log('[SW Update] Update detected automatically');

      this.state.hasUpdate = true;
      this.state.registration = registration;
      this.notify();
    }) as EventListener);

    // Detectar cuando el SW se activó
    window.addEventListener('sw-activated', () => {
      console.log('[SW Update] New SW activated, reloading...');
      // Pequeño delay para asegurar que el nuevo SW esté listo
      setTimeout(() => {
        window.location.reload();
      }, 100);
    });
  }

  /**
   * Notificar a todos los listeners
   */
  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('[SW Update] Error in listener:', error);
      }
    });
  }
}

// Instancia singleton
let swUpdateManager: SWUpdateManager | null = null;

/**
 * Obtener la instancia del manager de updates
 */
export function getSWUpdateManager(): SWUpdateManager {
  if (!swUpdateManager) {
    swUpdateManager = new SWUpdateManager();
  }
  return swUpdateManager;
}

/**
 * Hook para usar en componentes React
 */
export function useSWUpdate() {
  const manager = getSWUpdateManager();
  const [state, setState] = React.useState(manager.getState());

  React.useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    checkForUpdates: () => manager.checkForUpdates(),
    applyUpdate: () => manager.applyUpdate(),
    dismissUpdate: () => manager.dismissUpdate(),
  };
}

// Re-exportar para compatibilidad
export { SWUpdateManager };
export type { SWUpdateState };
