import React from 'react';

/**
 * Servicio de sincronización simplificado
 * 
 */

export class SyncService {
  private isOnline = false;

  constructor() {
    this.setupOnlineListener();
  }

  /**
   * Configurar listener para detectar cuando vuelve la conexión
   */
  private setupOnlineListener() {
    // Escuchar cambios en el estado de conexión
    window.addEventListener('online', () => {
      console.log('[SyncService] Connection restored, starting sync...');
      this.isOnline = true;
      this.autoSync();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncService] Connection lost');
      this.isOnline = false;
    });

    // Estado inicial
    this.isOnline = navigator.onLine;
  }

  /**
   * Verificar si se puede sincronizar (siempre true ahora, simplificado)
   */
  canSync(): boolean {
    return this.isOnline;
  }

  /**
   * Sincronización automática - placeholder simplificado
   */
  async autoSync(): Promise<any | null> {
    console.log('[SyncService] Auto-sync disabled (tables cleaned)');
    return null;
  }

  /**
   * Sincronización manual - placeholder simplificado
   */
  async sync(): Promise<any> {
    throw new Error('Sync service disabled - tables were cleaned up');
  }

  /**
   * Agregar operación - deshabilitado
   */
  async queueOperation(): Promise<string> {
    throw new Error('Queue operations disabled - tables cleaned up');
  }

  /**
   * Obtener estadísticas - versión simplificada
   */
  async getSyncStats() {
    return {
      queue: { total: 0, pending: 0, failed: 0 },
      connection: {
        isOnline: this.isOnline,
        canSync: this.canSync(),
        syncInProgress: false,
      },
      summary: {
        pendingOperations: 0,
        failedOperations: 0,
        totalOperations: 0,
        needsAttention: false,
      },
    };
  }

  /**
   * Reintentar operaciones - deshabilitado
   */
  async retryFailedOperations(): Promise<any> {
    throw new Error('Retry operations disabled - tables cleaned up');
  }

  /**
   * Limpiar operaciones - deshabilitado
   */
  async cleanOldOperations(): Promise<number> {
    console.log('[SyncService] Clean operations disabled - no queue');
    return 0;
  }

  /**
   * Cancelar sincronización - deshabilitado
   */
  cancelSync(): void {
    console.log('[SyncService] Cancel sync disabled - no active sync');
  }

  /**
   * Manejar conflictos - deshabilitado
   */
  private async handleConflicts(): Promise<void> {
    console.log('[SyncService] Conflict handling disabled');
  }

  /**
   * Pull sync - deshabilitado
   */
  async pullSync(): Promise<void> {
    console.log('[SyncService] Pull sync disabled - tables cleaned up');
  }

  /**
   * Full sync - deshabilitado
   */
  async fullSync(): Promise<any> {
    throw new Error('Full sync disabled - tables cleaned up');
  }
}

// Instancia singleton
let syncService: SyncService | null = null;

/**
 * Obtener instancia del servicio de sync
 */
export function getSyncService(): SyncService {
  if (!syncService) {
    syncService = new SyncService();
  }
  return syncService;
}

/**
 * Hook para usar el servicio de sync en componentes
 */
export function useSyncService() {
  const [stats, setStats] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const service = getSyncService();

  const refreshStats = React.useCallback(async () => {
    try {
      const newStats = await service.getSyncStats();
      setStats(newStats);
    } catch (error) {
      console.error('[useSyncService] Failed to load stats:', error);
    }
  }, [service]);

  const sync = React.useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[useSyncService] Sync disabled - tables cleaned up');
      // No hacer nada, solo simular
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshStats();
      return { success: true, operations: [], conflicts: [], stats: { uploaded: 0, downloaded: 0, errors: 0, conflicts: 0 } };
    } catch (error) {
      console.error('[useSyncService] Sync failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStats]);

  React.useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000); // Cada 30 segundos (menos frecuente)
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    service,
    stats,
    isLoading,
    canSync: service.canSync(),
    sync,
    refreshStats,
  };
}
