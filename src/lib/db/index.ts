/**
 * Utilidades de base de datos IndexedDB
 */

// Cliente principal
export {
  getDB,
  closeDB,
  clearDatabase,
  getDBStats,
  isIDBAvailable,
  ensureTablesExist,
  saveRecursosToIndexedDB,
  getRecursosFromIndexedDB,
  clearExpiredRecursos,
  getReportesOffline,
  getReporteOfflineById,
  getReportesOfflineByStatus,
  updateReporteOfflineSyncStatus,
  deleteReporteOffline,
  getReportesOfflineStats,
  type ActivosFijosDB,
} from './client';

// Esquemas y tipos
export type {
  BaseEntity,
  SyncStatus,
  AppConfig,
  DBStats,
  ConnectionStatus,
  ConnectionInfo,
} from './schema';
