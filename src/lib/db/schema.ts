/**
 * Esquemas y tipos para IndexedDB
 * Define la estructura de datos offline
 */

// Tipos base
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

// Estado de sincronización
export type SyncStatus = 'pending' | 'synced' | 'error';

// Configuración de la aplicación (timestamps de sync, etc.)
export interface AppConfig extends BaseEntity {
  key: string;
  value: any;
  category: 'sync' | 'config';
  description?: string;
}

// Estadísticas de la base de datos (simplificadas)
export interface DBStats {
  appConfig: number;
  recursos: number;
  unidades: number;
  clasificaciones: number;
  reportesOffline: number;
  storage: {
    used: number;
    available: number;
    quota: number;
  };
}

// Tipos para operaciones de sync
export interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'conflict_resolution';
  entityType: string;
  entityId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  operations: SyncOperation[];
  conflicts: ConflictResolution[];
  stats: {
    uploaded: number;
    downloaded: number;
    errors: number;
    conflicts: number;
  };
}

// Resolución de conflictos
export interface ConflictResolution {
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  strategy: 'server_wins' | 'local_wins' | 'manual_merge' | 'skip';
  resolved: boolean;
  resolvedData?: any;
}

// Configuración de sincronización
export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // en minutos
  maxRetries: number;
  batchSize: number;
  conflictStrategy: 'server_wins' | 'local_wins' | 'ask_user';
}

// Estados de conectividad
export type ConnectionStatus = 'online' | 'offline' | 'slow' | 'unstable';

export interface ConnectionInfo {
  status: ConnectionStatus;
  latency?: number;
  lastCheck: number;
  stable: boolean;
}
