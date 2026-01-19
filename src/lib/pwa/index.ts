/**
 * Utilidades PWA - Service Worker y Progressive Web App
 */

// Registro y gestión del Service Worker
export {
  registerServiceWorker,
  checkForSWUpdate,
  activateWaitingSW,
  unregisterServiceWorker,
  clearSWCaches,
  resetPWA,
} from './register-sw';

// Detección y manejo de actualizaciones
export {
  getSWUpdateManager,
  useSWUpdate,
  type SWUpdateState,
} from './sw-update';
