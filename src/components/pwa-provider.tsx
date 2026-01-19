/**
 * Provider PWA que registra el Service Worker y proporciona componentes globales
 * Debe ser cliente porque maneja registro del SW y estado
 */

'use client';

import React, { useEffect } from 'react';
import { registerServiceWorker, unregisterServiceWorker, clearSWCaches } from '@/lib/pwa';
import { GlobalOfflineBanner } from '@/components/offline-banner';
import { UpdateToast } from '@/components/update-toast';

interface PWAProviderProps {
  children: React.ReactNode;
}

// Función inmediata para limpiar SW en desarrollo (fuera del componente)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[PWA] 🚨 Development mode - Cleaning up service workers...');

  // Ejecutar inmediatamente, no esperar al useEffect
  Promise.all([
    unregisterServiceWorker(),
    clearSWCaches()
  ]).then(() => {
    console.log('[PWA] ✅ Development cleanup complete');
  }).catch((error) => {
    console.warn('[PWA] ⚠️ Error during development cleanup:', error);
  });
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // En producción: REGISTRAR service workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const registerSW = async () => {
        try {
          const result = await registerServiceWorker();

          if (result.success) {
            console.log('[PWA] Service Worker registered successfully');
          } else {
            console.warn('[PWA] Service Worker registration failed:', result.error);
          }
        } catch (error) {
          console.error('[PWA] Unexpected error registering SW:', error);
        }
      };

      registerSW();
    }
  }, []);

  return (
    <>
      {/* Banner global de conexión offline */}
      <GlobalOfflineBanner />

      {/* Toast de actualización de SW */}
      <UpdateToast />

      {/* Contenido principal */}
      {children}
    </>
  );
}
