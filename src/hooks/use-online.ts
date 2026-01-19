/**
 * Hook para detectar y monitorear el estado de conexión a internet
 * Proporciona información en tiempo real sobre la conectividad
 */

import { useState, useEffect, useCallback } from 'react';
import type { ConnectionStatus, ConnectionInfo } from '@/lib/db';

interface OnlineState extends ConnectionInfo {
  // Información adicional para UI
  isStable: boolean;
  lastOnlineAt?: number;
  lastOfflineAt?: number;
}

/**
 * Hook principal para estado de conexión
 */
export function useOnline(): OnlineState & {
  checkConnection: () => Promise<boolean>;
  forceOffline: () => void;
  forceOnline: () => void;
} {
  const [state, setState] = useState<OnlineState>({
    status: 'online',
    lastCheck: Date.now(),
    stable: true,
    isStable: true,
  });

  // Función para verificar conexión real
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Verificar conectividad básica
      if (!navigator.onLine) {
        updateState({
          status: 'offline',
          lastCheck: Date.now(),
          stable: false,
          lastOfflineAt: Date.now(),
        });
        return false;
      }

      // Verificar conectividad real con un ping rápido
      const startTime = Date.now();
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        // Determinar calidad de conexión
        let status: ConnectionStatus = 'online';
        if (latency > 2000) status = 'slow';
        if (latency > 5000) status = 'unstable';

        updateState({
          status,
          latency,
          lastCheck: Date.now(),
          stable: status === 'online',
          lastOnlineAt: Date.now(),
        });

        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.warn('[useOnline] Connection check failed:', error);

      updateState({
        status: 'offline',
        lastCheck: Date.now(),
        stable: false,
        lastOfflineAt: Date.now(),
      });

      return false;
    }
  }, []);

  // Función interna para actualizar estado
  const updateState = useCallback((updates: Partial<OnlineState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      // Calcular estabilidad basada en cambios recientes
      isStable: calculateStability(prev, updates),
    }));
  }, []);

  // Calcular estabilidad de conexión
  const calculateStability = useCallback((prev: OnlineState, updates: Partial<OnlineState>): boolean => {
    const now = Date.now();
    const timeWindow = 30000; // 30 segundos

    // Si no hay cambios en estado, es estable
    if (updates.status === prev.status) {
      return prev.isStable;
    }

    // Si cambió recientemente, no es estable
    if (now - prev.lastCheck < timeWindow) {
      return false;
    }

    // Si cambió pero pasó tiempo suficiente, puede ser estable
    return updates.status === 'online';
  }, []);

  // Funciones para forzar estados (útil para testing)
  const forceOffline = useCallback(() => {
    updateState({
      status: 'offline',
      lastCheck: Date.now(),
      stable: false,
      lastOfflineAt: Date.now(),
    });
  }, [updateState]);

  const forceOnline = useCallback(() => {
    updateState({
      status: 'online',
      lastCheck: Date.now(),
      stable: true,
      lastOnlineAt: Date.now(),
    });
  }, [updateState]);

  // Efecto para configurar event listeners
  useEffect(() => {
    // Event listeners nativos del navegador
    const handleOnline = () => {
      console.log('[useOnline] Browser reports online');
      checkConnection();
    };

    const handleOffline = () => {
      console.log('[useOnline] Browser reports offline');
      updateState({
        status: 'offline',
        lastCheck: Date.now(),
        stable: false,
        lastOfflineAt: Date.now(),
      });
    };

    // Agregar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar conexión inicial
    checkConnection();

    // Verificar conexión periódicamente
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkConnection();
      }
    }, 30000); // Cada 30 segundos

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, updateState]);

  return {
    ...state,
    checkConnection,
    forceOffline,
    forceOnline,
  };
}

/**
 * Hook simplificado que solo retorna true/false
 */
export function useIsOnline(): boolean {
  const { status } = useOnline();
  return status === 'online';
}

/**
 * Hook para acciones que requieren conexión
 */
export function useRequireOnline(): {
  canProceed: boolean;
  message?: string;
  checkAndProceed: <T>(action: () => T | Promise<T>) => Promise<T | null>;
} {
  const { status, latency, checkConnection } = useOnline();

  const canProceed = status === 'online';
  const message = !canProceed
    ? status === 'offline'
      ? 'Se requiere conexión a internet'
      : 'Conexión inestable, intenta nuevamente'
    : undefined;

  const checkAndProceed = useCallback(async <T,>(
    action: () => T | Promise<T>
  ): Promise<T | null> => {
    if (!canProceed) {
      // Intentar reconectar
      const isNowOnline = await checkConnection();
      if (!isNowOnline) {
        return null;
      }
    }

    try {
      return await action();
    } catch (error) {
      console.error('[useRequireOnline] Action failed:', error);
      return null;
    }
  }, [canProceed, checkConnection]);

  return {
    canProceed,
    message,
    checkAndProceed,
  };
}
