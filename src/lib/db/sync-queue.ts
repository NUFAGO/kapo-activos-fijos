/**
 * Gestión de la queue de sincronización (DESHABILITADO)
 * Las tablas de sync fueron eliminadas por limpieza de código
 * Este archivo mantiene compatibilidad pero no hace nada
 */

import { getDB } from './client';
import type { DBStats } from './schema';

// Clase stub - mantiene compatibilidad pero no hace nada
export class SyncQueueManager {
  private isProcessing = false;

  /**
   * Agregar una operación a la queue (deshabilitado)
   */
  async addOperation(): Promise<string> {
    console.log('[SyncQueue] Disabled - sync tables cleaned up');
    return crypto.randomUUID();
  }

  /**
   * Obtener operaciones pendientes (deshabilitado)
   */
  async getPendingOperations(): Promise<any[]> {
    console.log('[SyncQueue] Disabled - sync tables cleaned up');
    return [];
  }

  /**
   * Procesar la queue de sincronización (deshabilitado)
   */
  async processQueue(): Promise<any> {
    console.log('[SyncQueue] Disabled - sync tables cleaned up');
    return {
      success: true,
      operations: [],
      conflicts: [],
      stats: { uploaded: 0, downloaded: 0, errors: 0, conflicts: 0 }
    };
  }

  /**
   * Obtener estadísticas (deshabilitado)
   */
  async getStats(): Promise<any> {
    return {
      total: 0,
      pending: 0,
      failed: 0,
      completed: 0
    };
  }

  /**
   * Cancelar procesamiento (deshabilitado)
   */
  cancelProcessing(): void {
    console.log('[SyncQueue] Cancel disabled - no processing');
  }

  /**
   * Limpiar operaciones completadas (deshabilitado)
   */
  async cleanCompletedOperations(): Promise<number> {
    console.log('[SyncQueue] Clean disabled - no operations');
    return 0;
  }

  /**
   * Verificar si está procesando (siempre false)
   */
  isCurrentlyProcessing(): boolean {
    return false;
  }
}

// Instancia singleton (stub)
let syncQueueManager: SyncQueueManager | null = null;

/**
 * Obtener instancia del manager (stub)
 */
export function getSyncQueueManager(): SyncQueueManager {
  if (!syncQueueManager) {
    syncQueueManager = new SyncQueueManager();
  }
  return syncQueueManager;
}
