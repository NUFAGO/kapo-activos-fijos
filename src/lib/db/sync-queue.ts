/**
 * Gestión de la queue de sincronización
 * Maneja operaciones pendientes para enviar al servidor cuando haya conexión
 */

import { getDB } from './client';
import type {
  SyncQueueItem,
  SyncOperation,
  SyncResult,
  ConflictResolution
} from './schema';

// Clase principal para manejar la queue de sync
export class SyncQueueManager {
  private isProcessing = false;
  private abortController?: AbortController;

  /**
   * Agregar una operación a la queue
   */
  async addOperation(operation: Omit<SyncQueueItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'retryCount' | 'maxRetries'>): Promise<string> {
    const db = await getDB();

    const queueItem: SyncQueueItem = {
      ...operation,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      timestamp: Date.now(),
      priority: operation.priority || 'normal',
    };

    await db.add('syncQueue', queueItem);
    console.log('[SyncQueue] Operation added:', queueItem.id);

    return queueItem.id;
  }

  /**
   * Obtener operaciones pendientes
   */
  async getPendingOperations(limit = 50): Promise<SyncQueueItem[]> {
    const db = await getDB();

    const operations = await db.getAllFromIndex('syncQueue', 'timestamp') as SyncQueueItem[];
    return operations
      .filter(op => op.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, limit);
  }

  /**
   * Procesar la queue de sincronización
   */
  async processQueue(signal?: AbortSignal): Promise<SyncResult> {
    if (this.isProcessing) {
      throw new Error('Sync already in progress');
    }

    this.isProcessing = true;
    this.abortController = new AbortController();

    const operations: SyncOperation[] = [];
    const conflicts: ConflictResolution[] = [];

    try {
      console.log('[SyncQueue] Starting queue processing...');

      const pendingOps = await this.getPendingOperations();

      if (pendingOps.length === 0) {
        console.log('[SyncQueue] No pending operations');
        return {
          success: true,
          operations: [],
          conflicts: [],
          stats: { uploaded: 0, downloaded: 0, errors: 0, conflicts: 0 }
        };
      }

      console.log(`[SyncQueue] Processing ${pendingOps.length} operations`);

      let successCount = 0;
      let errorCount = 0;

      for (const op of pendingOps) {
        // Verificar si fue abortado
        if (signal?.aborted || this.abortController?.signal.aborted) {
          console.log('[SyncQueue] Processing aborted');
          break;
        }

        const operation: SyncOperation = {
          id: op.id,
          type: 'upload',
          entityType: op.entityType,
          entityId: op.entityId,
          status: 'in_progress',
          startedAt: Date.now(),
        };

        try {
          operations.push(operation);

          const result = await this.executeOperation(op);

          if (result.success) {
            operation.status = 'completed';
            operation.completedAt = Date.now();
            successCount++;

            // Marcar como completada en DB
            await this.markCompleted(op.id);
          } else {
            operation.status = 'failed';
            operation.error = result.error;
            errorCount++;

            // Marcar como fallida y programar reintento
            await this.markFailed(op.id, result.error || 'Unknown error');
          }

        } catch (error) {
          operation.status = 'failed';
          operation.error = error instanceof Error ? error.message : 'Unknown error';
          errorCount++;

          await this.markFailed(op.id, operation.error);
        }
      }

      console.log(`[SyncQueue] Processing completed: ${successCount} success, ${errorCount} errors`);

      return {
        success: errorCount === 0,
        operations,
        conflicts,
        stats: {
          uploaded: successCount,
          downloaded: 0, // TODO: implementar download
          errors: errorCount,
          conflicts: conflicts.length
        }
      };

    } catch (error) {
      console.error('[SyncQueue] Processing failed:', error);
      return {
        success: false,
        operations,
        conflicts,
        stats: { uploaded: 0, downloaded: 0, errors: operations.length, conflicts: 0 }
      };
    } finally {
      this.isProcessing = false;
      this.abortController = undefined;
    }
  }

  /**
   * Ejecutar una operación individual
   */
  private async executeOperation(operation: SyncQueueItem): Promise<{ success: boolean; error?: string }> {
    try {
      // Aquí iría la lógica real de envío al servidor
      // Por ahora simulamos una llamada HTTP

      console.log(`[SyncQueue] Executing ${operation.operation} on ${operation.endpoint}`);

      // Simulación de llamada HTTP
      const response = await fetch(operation.endpoint, {
        method: operation.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: operation.method !== 'DELETE' ? JSON.stringify(operation.payload) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      console.error('[SyncQueue] Operation failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Marcar operación como completada
   */
  private async markCompleted(id: string): Promise<void> {
    const db = await getDB();
    const operation = await db.get('syncQueue', id);

    if (operation) {
      await db.put('syncQueue', {
        ...operation,
        status: 'completed',
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * Marcar operación como fallida y programar reintento
   */
  private async markFailed(id: string, error: string): Promise<void> {
    const db = await getDB();
    const operation = await db.get('syncQueue', id);

    if (operation) {
      const newRetryCount = operation.retryCount + 1;
      const shouldRetry = newRetryCount < operation.maxRetries;

      await db.put('syncQueue', {
        ...operation,
        status: shouldRetry ? 'pending' : 'failed',
        retryCount: newRetryCount,
        errorMessage: error,
        updatedAt: Date.now(),
        nextRetryAt: shouldRetry
          ? Date.now() + Math.pow(2, newRetryCount) * 60000 // Exponential backoff
          : undefined,
      });
    }
  }

  /**
   * Limpiar operaciones completadas antiguas
   */
  async cleanCompletedOperations(olderThanDays = 7): Promise<number> {
    const db = await getDB();
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    const completedOps = await db.getAllFromIndex('syncQueue', 'timestamp');

    let deletedCount = 0;
    for (const op of completedOps) {
      if (op.status === 'completed' && op.updatedAt < cutoffTime) {
        await db.delete('syncQueue', op.id);
        deletedCount++;
      }
    }

    console.log(`[SyncQueue] Cleaned ${deletedCount} old completed operations`);
    return deletedCount;
  }

  /**
   * Obtener estadísticas de la queue
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const db = await getDB();
    const all = await db.getAll('syncQueue');

    return all.reduce(
      (stats, op) => {
        stats.total++;
        stats[op.status]++;
        return stats;
      },
      { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 }
    );
  }

  /**
   * Cancelar procesamiento actual
   */
  cancelProcessing(): void {
    this.abortController?.abort();
  }

  /**
   * Verificar si está procesando
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

// Instancia singleton
let syncQueueManager: SyncQueueManager | null = null;

/**
 * Obtener instancia del manager de sync queue
 */
export function getSyncQueueManager(): SyncQueueManager {
  if (!syncQueueManager) {
    syncQueueManager = new SyncQueueManager();
  }
  return syncQueueManager;
}
