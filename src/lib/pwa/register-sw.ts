/**
 * Utilidades para registro y gestión del Service Worker
 * Implementación segura que evita problemas comunes
 */

interface SWRegistrationResult {
  success: boolean;
  error?: string;
  registration?: ServiceWorkerRegistration;
}

interface SWUpdateInfo {
  hasUpdate: boolean;
  registration?: ServiceWorkerRegistration;
}

/**
 * Registra el Service Worker de forma segura
 * Solo en producción y cuando está disponible
 */
export async function registerServiceWorker(): Promise<SWRegistrationResult> {
  // Permitir registro en desarrollo para testing local
  // if (process.env.NODE_ENV !== 'production') {
  //   console.log('[PWA] SW registration skipped in development');
  //   return { success: false, error: 'Development mode' };
  // }

  // Verificar soporte
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported');
    return { success: false, error: 'Not supported' };
  }

  try {
    console.log('[PWA] Registering Service Worker...');

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] SW registered successfully:', registration.scope);

    // Configurar event listeners para el ciclo de vida
    setupSWEventListeners(registration);

    return { success: true, registration };
  } catch (error) {
    console.error('[PWA] SW registration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Configura los event listeners del Service Worker
 */
function setupSWEventListeners(registration: ServiceWorkerRegistration) {
  // Nuevo SW disponible
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    console.log('[PWA] New SW found, installing...');

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        console.log('[PWA] New SW installed, ready to activate');
        // Aquí se disparará el evento de actualización
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sw-update-available', {
            detail: { registration }
          }));
        }
      }
    });
  });

  // SW activado
  registration.addEventListener('controllerchange', () => {
    console.log('[PWA] SW controller changed');
    // El nuevo SW tomó control
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sw-activated'));
    }
  });

  // Estado del SW cambió
  if (registration.active) {
    registration.active.addEventListener('statechange', (event) => {
      console.log('[PWA] SW state changed:', (event.target as ServiceWorker)?.state);
    });
  }
}

/**
 * Verifica si hay una actualización disponible
 */
export async function checkForSWUpdate(): Promise<SWUpdateInfo> {
  if (!('serviceWorker' in navigator)) {
    return { hasUpdate: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      return { hasUpdate: false };
    }

    // Si hay un SW esperando, hay actualización
    if (registration.waiting) {
      return { hasUpdate: true, registration };
    }

    // Si hay uno instalándose, esperamos
    if (registration.installing) {
      return new Promise((resolve) => {
        registration.installing!.addEventListener('statechange', () => {
          if (registration.waiting) {
            resolve({ hasUpdate: true, registration });
          } else {
            resolve({ hasUpdate: false });
          }
        });
      });
    }

    return { hasUpdate: false };
  } catch (error) {
    console.error('[PWA] Error checking for updates:', error);
    return { hasUpdate: false };
  }
}

/**
 * Fuerza la activación de un SW esperando
 */
export async function activateWaitingSW(registration?: ServiceWorkerRegistration): Promise<void> {
  const reg = registration || await navigator.serviceWorker.getRegistration();

  if (!reg?.waiting) {
    console.warn('[PWA] No waiting SW to activate');
    return;
  }

  console.log('[PWA] Activating waiting SW...');
  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Desregistra completamente el Service Worker
 * Útil para desarrollo o reset de emergencia
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      console.log('[PWA] Unregistering SW:', registration.scope);
      await registration.unregister();
    }

    console.log('[PWA] All SWs unregistered');
  } catch (error) {
    console.error('[PWA] Error unregistering SWs:', error);
  }
}

/**
 * Limpia todas las caches del Service Worker
 */
export async function clearSWCaches(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    console.log('[PWA] Clearing caches:', cacheNames);

    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );

    console.log('[PWA] All caches cleared');
  } catch (error) {
    console.error('[PWA] Error clearing caches:', error);
  }
}

/**
 * Reset completo: desregistra SW y limpia caches
 */
export async function resetPWA(): Promise<void> {
  console.log('[PWA] Performing complete PWA reset...');

  await Promise.all([
    unregisterServiceWorker(),
    clearSWCaches(),
  ]);

  console.log('[PWA] PWA reset complete');
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}
