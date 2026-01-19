import React from 'react';

/**
 * Servicio de sincronización para manejar datos offline/online
 * Coordina entre IndexedDB local y servidor GraphQL
 */

import { getSyncQueueManager } from '@/lib/db';
import { SyncQueueManager } from '@/lib/db/sync-queue';
import type { SyncResult, SyncOperation, ConflictResolution } from '@/lib/db';

export class SyncService {
  private queueManager: SyncQueueManager;
  private isOnline = false;
  private syncInProgress = false;

  constructor() {
    this.queueManager = getSyncQueueManager();
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
   * Verificar si se puede sincronizar
   */
  canSync(): boolean {
    return this.isOnline && !this.syncInProgress;
  }

  /**
   * Sincronización automática cuando vuelve la conexión
   */
  async autoSync(): Promise<SyncResult | null> {
    if (!this.canSync()) {
      return null;
    }

    try {
      console.log('[SyncService] Starting auto-sync...');
      return await this.sync();
    } catch (error) {
      console.error('[SyncService] Auto-sync failed:', error);
      return null;
    }
  }

  /**
   * Sincronización manual
   */
  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    this.syncInProgress = true;

    try {
      console.log('[SyncService] Starting manual sync...');

      // Crear AbortController para poder cancelar
      const abortController = new AbortController();

      // Ejecutar sincronización
      const result = await this.queueManager.processQueue(abortController.signal);

      console.log('[SyncService] Sync completed:', result);

      // Procesar conflictos si los hay
      if (result.conflicts.length > 0) {
        await this.handleConflicts(result.conflicts);
      }

      return result;

    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Agregar una operación a la queue de sync
   */
  async queueOperation(operation: {
    entityId: string;
    entityType: 'informe' | 'proyecto' | 'maquinaria';
    operation: 'create' | 'update' | 'delete';
    endpoint: string;
    payload?: any;
  }): Promise<string> {
    const operationId = await this.queueManager.addOperation({
      entityId: operation.entityId,
      entityType: operation.entityType,
      operation: operation.operation,
      endpoint: operation.endpoint,
      method: operation.operation === 'delete' ? 'DELETE' :
              operation.operation === 'create' ? 'POST' : 'PUT',
      payload: operation.payload,
      timestamp: Date.now(),
      priority: 'normal',
    });

    console.log(`[SyncService] Queued ${operation.operation} operation:`, operationId);

    // Intentar sync inmediato si estamos online
    if (this.canSync()) {
      setTimeout(() => this.autoSync(), 1000); // Delay pequeño
    }

    return operationId;
  }

  /**
   * Obtener estadísticas de sincronización
   */
  async getSyncStats() {
    const queueStats = await this.queueManager.getStats();
    const isOnline = this.isOnline;
    const canSync = this.canSync();

    return {
      queue: queueStats,
      connection: {
        isOnline,
        canSync,
        syncInProgress: this.syncInProgress,
      },
      summary: {
        pendingOperations: queueStats.pending,
        failedOperations: queueStats.failed,
        totalOperations: queueStats.total,
        needsAttention: queueStats.failed > 0,
      },
    };
  }

  /**
   * Reintentar operaciones fallidas
   */
  async retryFailedOperations(): Promise<SyncResult> {
    if (!this.canSync()) {
      throw new Error('Cannot retry: no connection or sync in progress');
    }

    console.log('[SyncService] Retrying failed operations...');

    // Obtener operaciones fallidas y marcarlas como pendientes
    const db = await import('@/lib/db').then(m => m.getDB());
    const failedOps = await db.getAllFromIndex('syncQueue', 'timestamp');

    const retryOps = failedOps.filter(op => op.status === 'failed');

    if (retryOps.length === 0) {
      return {
        success: true,
        operations: [],
        conflicts: [],
        stats: { uploaded: 0, downloaded: 0, errors: 0, conflicts: 0 }
      };
    }

    console.log(`[SyncService] Retrying ${retryOps.length} failed operations`);

    // Marcar como pendientes para reintento
    const updates = retryOps.map(op => ({
      ...op,
      status: 'pending' as const,
      retryCount: 0,
      updatedAt: Date.now(),
    }));

    await Promise.all(updates.map(op => db.put('syncQueue', op)));

    // Ejecutar sync
    return await this.sync();
  }

  /**
   * Limpiar operaciones completadas antiguas
   */
  async cleanOldOperations(daysOld = 7): Promise<number> {
    return await this.queueManager.cleanCompletedOperations(daysOld);
  }

  /**
   * Cancelar sincronización en curso
   */
  cancelSync(): void {
    if (this.syncInProgress) {
      console.log('[SyncService] Cancelling sync...');
      this.queueManager.cancelProcessing();
    }
  }

  /**
   * Manejar conflictos de sincronización
   * (Versión básica - solo logging)
   */
  private async handleConflicts(conflicts: ConflictResolution[]): Promise<void> {
    console.warn('[SyncService] Conflicts detected:', conflicts.length);

    for (const conflict of conflicts) {
      console.warn('[SyncService] Conflict:', {
        entity: conflict.entityId,
        type: conflict.entityType,
        strategy: conflict.strategy,
      });

      // TODO: Implementar resolución automática de conflictos
      // Por ahora, solo loggear
    }
  }

  /**
   * Forzar actualización de datos desde el servidor
   * (Pull sync - descargar cambios del servidor)
   */
  async pullSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot pull sync: no connection');
    }

    console.log('[SyncService] Starting pull sync...');

    // TODO: Implementar lógica para descargar cambios del servidor
    // - Obtener timestamp de última sync
    // - Consultar cambios desde entonces
    // - Actualizar IndexedDB
    // - Resolver conflictos

    console.log('[SyncService] Pull sync completed (placeholder)');
  }

  /**
   * Sincronización completa (push + pull)
   */
  async fullSync(): Promise<SyncResult> {
    console.log('[SyncService] Starting full sync...');

    // Primero push (enviar cambios locales)
    const pushResult = await this.sync();

    // Luego pull (descargar cambios del servidor)
    await this.pullSync();

    return pushResult;
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
      const result = await service.sync();
      await refreshStats();
      return result;
    } catch (error) {
      console.error('[useSyncService] Sync failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [service, refreshStats]);

  React.useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 10000); // Cada 10 segundos
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
