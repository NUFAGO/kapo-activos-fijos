/**
 * 🧩 COMPONENTS - COMPONENTES PRINCIPALES
 *
 * Responsabilidad: Exportar componentes principales de la aplicación
 * Flujo: Importado por páginas → Componentes reutilizables
 *
 * Organizado por:
 * - common/: Componentes globales (AutocompleteDisabler)
 * - layout/: Componentes de layout (Header, Sidebar)
 * - presupuesto/: Componentes específicos del negocio
 * - ui/: Componentes base de UI (Button, Input, etc.)
 */

// Re-exportar de subcarpetas
export * from './common';
export * from './ui';

// Componentes PWA y offline
export { UpdateToast, UpdateBanner } from './update-toast';
export { OfflineBanner, GlobalOfflineBanner, ConnectionBadge } from './offline-banner';
export { SyncIndicator, SyncBadge, useSyncStatus } from './sync-indicator';
export { PWAProvider } from './pwa-provider';
