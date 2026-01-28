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
  getRecursosOfflineFromIndexedDB,
  saveRecursoOffline,
  getRecursoById,
  replaceRecursoTempWithReal,
  replaceTempRefsInAllReportesOffline,
  clearExpiredRecursos,
  saveUnidadesToIndexedDB,
  getUnidadesFromIndexedDB,
  saveClasificacionesToIndexedDB,
  getClasificacionesFromIndexedDB,
  getReportesOffline,
  getReporteOfflineById,
  getReportesOfflineByStatus,
  updateReporteOfflineSyncStatus,
  updateReporteOffline,
  deleteReporteOffline,
  getReportesOfflineStats,
  type ReplaceTempResult,
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
