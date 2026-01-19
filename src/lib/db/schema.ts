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

// Informe de maquinaria (datos principales offline)
export interface OfflineInforme extends BaseEntity {
  // Datos del informe
  proyectoId: string;
  maquinariaId: string;
  fecha: string;
  operador: string;

  // Campos editables offline
  detalleMaquinariaCampos: {
    calentamiento: number;
    total_kilometros: number;
    [key: string]: any; // Para campos dinámicos
  };

  // Estado de sync
  syncStatus: SyncStatus;
  lastSyncAttempt?: number;
  syncError?: string;
  version: number; // Para conflictos
}

// Item en la queue de sincronización
export interface SyncQueueItem extends BaseEntity {
  // Identificación
  entityId: string; // ID del informe o entidad relacionada
  entityType: 'informe' | 'proyecto' | 'maquinaria';

  // Operación a sincronizar
  operation: 'create' | 'update' | 'delete';

  // Datos para enviar
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;

  // Estado y reintentos
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
  nextRetryAt?: number;
  timestamp: number;

  // Información de error
  errorMessage?: string;
  errorCode?: string;

  // Prioridad (para ordenar sync)
  priority: 'low' | 'normal' | 'high' | 'critical';

}

// Datos de referencia cacheados (solo lectura)
export interface ReferenceData extends BaseEntity {
  // Identificador único
  key: string;

  // Categoría de datos
  category: 'proyectos' | 'maquinaria' | 'operadores' | 'config';

  // Datos cacheados
  data: any;

  // Control de expiración
  expiresAt: number;
  ttl: number; // Time to live en segundos

  // Versionado
  version: number;
  etag?: string; // Para validar cambios
}

// Configuración de la aplicación
export interface AppConfig extends BaseEntity {
  key: string;
  value: any;
  category: 'ui' | 'sync' | 'cache' | 'offline';
  description?: string;
}

// Estadísticas de la base de datos
export interface DBStats {
  informes: {
    total: number;
    pending: number;
    error: number;
    synced: number;
  };
  syncQueue: {
    total: number;
    pending: number;
    failed: number;
  };
  referenceData: {
    total: number;
    expired: number;
  };
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
