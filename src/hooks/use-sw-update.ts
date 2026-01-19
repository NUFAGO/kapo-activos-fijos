/**
 * Hook para detectar y manejar actualizaciones del Service Worker
 * Wrapper conveniente alrededor del SWUpdateManager
 */

import { useState, useEffect } from 'react';
import { useSWUpdate } from '@/lib/pwa';

/**
 * Hook principal para actualizaciones del SW
 * Proporciona estado y acciones para manejar updates
 */
export function useServiceWorkerUpdate() {
  const swUpdate = useSWUpdate();

  return {
    // Estado
    hasUpdate: swUpdate.hasUpdate,
    isUpdating: swUpdate.isUpdating,

    // Acciones
    checkForUpdates: swUpdate.checkForUpdates,
    applyUpdate: swUpdate.applyUpdate,
    dismissUpdate: swUpdate.dismissUpdate,

    // Información adicional
    registration: swUpdate.registration,
  };
}

/**
 * Hook simplificado para mostrar notificación de update
 * Retorna solo lo necesario para mostrar un toast/banner
 */
export function useUpdateNotification(): {
  showUpdate: boolean;
  applyUpdate: () => void;
  dismissUpdate: () => void;
} {
  const { hasUpdate, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  return {
    showUpdate: hasUpdate,
    applyUpdate,
    dismissUpdate,
  };
}

/**
 * Hook para mostrar indicador de carga durante update
 */
export function useUpdateProgress(): {
  isUpdating: boolean;
  message: string;
} {
  const { isUpdating, hasUpdate } = useServiceWorkerUpdate();

  let message = '';
  if (isUpdating) {
    message = 'Aplicando actualización...';
  } else if (hasUpdate) {
    message = 'Nueva versión disponible';
  }

  return {
    isUpdating,
    message,
  };
}
