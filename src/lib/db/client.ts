/**
 * Cliente IndexedDB para almacenamiento offline
 * Versión segura con migraciones y error handling
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { DBStats } from './schema';

// Versionado de la base de datos
const DB_NAME = 'activos-fijos-db';
const DB_VERSION = 4; // Incrementado para limpieza de tablas no usadas

// Esquema de la base de datos
interface ActivosFijosDB extends DBSchema {
  // Configuración de la app (timestamps de sync, etc.)
  appConfig: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };

  // Recursos activos (catálogo offline)
  recursos: {
    key: string;
    value: {
      id: string;
      recurso_id: string;
      codigo: string;
      nombre: string;
      descripcion: string;
      activo_fijo: boolean;
      unidad: string | null;
      tipo_recurso: string | null;
      lastFetched: number;
      expiresAt: number;
    };
    indexes: {
      'codigo': 'codigo';
      'nombre': 'nombre';
      'activo_fijo': 'activo_fijo';
      'expiresAt': 'expiresAt';
    };
  };

  // Reportes de activos fijos offline (no sincronizados automáticamente)
  reportesOffline: {
    key: string;
    value: {
      id: string;
      titulo: string;
      recursos: Array<{
        id_recurso: string;
        codigo_recurso: string;
        nombre_recurso: string;
        marca: string;
        estado: 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado';
        descripcion: string;
        evidencia_urls: string[];
        evidence_files: Blob[]; // Todas las imágenes como Blobs
      }>;
      notas_generales: string;
      // Metadata del usuario
      usuario_id?: string;
      usuario_nombres?: string;
      // Fechas
      fecha_creacion: number;
      fecha_sincronizacion?: number; // null hasta que se sincronice
      // Estado de sincronización
      sync_status: 'pending' | 'synced' | 'error';
      sync_error?: string;
      version: number;
      // Estadísticas
      total_recursos: number;
      total_imagenes: number;
    };
    indexes: {
      'sync_status': 'sync_status';
      'fecha_creacion': 'fecha_creacion';
      'usuario_id': 'usuario_id';
      'fecha_sincronizacion': 'fecha_sincronizacion';
    };
  };
}

let dbInstance: IDBPDatabase<ActivosFijosDB> | null = null;

/**
 * Obtener instancia de la base de datos
 * Se inicializa solo una vez (singleton)
 */
export async function getDB(): Promise<IDBPDatabase<ActivosFijosDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    console.log('[IndexedDB] Opening database...');

    dbInstance = await openDB<ActivosFijosDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`[IndexedDB] Upgrading from v${oldVersion} to v${newVersion}`);

        // ✅ LIMPIEZA: Solo crear tablas que REALMENTE se usan

        // 1. Tabla de recursos (PRIORIDAD ALTA - ACTIVA)
        if (!db.objectStoreNames.contains('recursos')) {
          console.log('[IndexedDB] 🚀 Creating recursos table (REQUIRED)');
          const recursosStore = db.createObjectStore('recursos', {
            keyPath: 'id'
          });
          recursosStore.createIndex('codigo', 'codigo');
          recursosStore.createIndex('nombre', 'nombre');
          recursosStore.createIndex('activo_fijo', 'activo_fijo');
          recursosStore.createIndex('expiresAt', 'expiresAt');
          console.log('[IndexedDB] ✅ Recursos table created successfully');
        } else {
          console.log('[IndexedDB] ℹ️ Recursos table already exists');
        }

        // 2. Configuración de la app (ACTIVA)
        if (!db.objectStoreNames.contains('appConfig')) {
          console.log('[IndexedDB] Creating appConfig table');
          db.createObjectStore('appConfig', {
            keyPath: 'key'
          });
        }

        // 3. Reportes offline (ACTIVA - se crea después)
        if (!db.objectStoreNames.contains('reportesOffline')) {
          console.log('[IndexedDB] 🚀 Creating reportesOffline table (v4)');
          const reportesStore = db.createObjectStore('reportesOffline', {
            keyPath: 'id'
          });
          reportesStore.createIndex('sync_status', 'sync_status');
          reportesStore.createIndex('fecha_creacion', 'fecha_creacion');
          reportesStore.createIndex('usuario_id', 'usuario_id');
          reportesStore.createIndex('fecha_sincronizacion', 'fecha_sincronizacion');
          console.log('[IndexedDB] ✅ ReportesOffline table created successfully');
        } else {
          console.log('[IndexedDB] ℹ️ ReportesOffline table already exists');
        }

        // 6. Reportes offline (v3)
        if (!db.objectStoreNames.contains('reportesOffline')) {
          console.log('[IndexedDB] 🚀 Creating reportesOffline table (v3)');
          const reportesStore = db.createObjectStore('reportesOffline', {
            keyPath: 'id'
          });
          reportesStore.createIndex('sync_status', 'sync_status');
          reportesStore.createIndex('fecha_creacion', 'fecha_creacion');
          reportesStore.createIndex('usuario_id', 'usuario_id');
          reportesStore.createIndex('fecha_sincronizacion', 'fecha_sincronizacion');
          console.log('[IndexedDB] ✅ ReportesOffline table created successfully');
        } else {
          console.log('[IndexedDB] ℹ️ ReportesOffline table already exists');
        }

        console.log('[IndexedDB] 🎉 Database upgrade completed - All tables verified/created');
      },

      blocked() {
        console.warn('[IndexedDB] Database blocked - close other tabs');
      },

      blocking() {
        console.warn('[IndexedDB] Database blocking - will close soon');
        // Cerrar la conexión actual
        dbInstance?.close();
        dbInstance = null;
      },

      terminated() {
        console.error('[IndexedDB] Database terminated unexpectedly');
        dbInstance = null;
      },
    });

    console.log('[IndexedDB] Database opened successfully');
    return dbInstance;

  } catch (error) {
    console.error('[IndexedDB] Failed to open database:', error);
    throw new Error(`Database initialization failed: ${error}`);
  }
}

/**
 * Cerrar la base de datos
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[IndexedDB] Database closed');
  }
}

/**
 * Limpiar toda la base de datos (reset completo)
 */
export async function clearDatabase(): Promise<void> {
  try {
    console.log('[IndexedDB] Clearing entire database...');

    const db = await getDB();
    // Solo limpiar las tablas que existen y se usan
    const activeStores: Array<'appConfig' | 'recursos' | 'reportesOffline'> = ['appConfig', 'recursos', 'reportesOffline'];
    const existingStores = activeStores.filter(storeName => db.objectStoreNames.contains(storeName));

    if (existingStores.length === 0) {
      console.log('[IndexedDB] No active stores to clear');
      return;
    }

    const transaction = db.transaction(existingStores, 'readwrite');

    await Promise.all(
      existingStores.map(storeName => {
        const store = transaction.objectStore(storeName);
        return store.clear();
      })
    );

    await transaction.done;
    console.log('[IndexedDB] Database cleared successfully');

  } catch (error) {
    console.error('[IndexedDB] Failed to clear database:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de la base de datos
 */
export async function getDBStats(): Promise<DBStats> {
  try {
    const db = await getDB();

    // Solo contamos las tablas que existen
    const [appConfigCount, recursosCount, reportesOfflineCount] = await Promise.all([
      db.count('appConfig').catch(() => 0),
      db.count('recursos').catch(() => 0),
      db.count('reportesOffline').catch(() => 0),
    ]);

    // Estimación de storage (si está disponible)
    let storageEstimate;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      storageEstimate = await navigator.storage.estimate();
    }

    return {
      // Estadísticas simplificadas - solo tablas activas
      appConfig: appConfigCount,
      recursos: recursosCount,
      reportesOffline: reportesOfflineCount,
      storage: {
        used: storageEstimate?.usage || 0,
        available: (storageEstimate?.quota || 0) - (storageEstimate?.usage || 0),
        quota: storageEstimate?.quota || 0,
      },
    };

  } catch (error) {
    console.error('[IndexedDB] Failed to get stats:', error);
    throw error;
  }
}

/**
 * Verificar si IndexedDB está disponible
 */
export function isIDBAvailable(): boolean {
  try {
    // Verificar soporte básico
    if (!('indexedDB' in window)) {
      return false;
    }

    // Verificar que no esté deshabilitado
    if (!window.indexedDB) {
      return false;
    }

    // Verificar que podemos crear una base de datos de prueba
    const testDB = indexedDB.open('test-db', 1);
    testDB.onerror = () => {
      console.warn('[IndexedDB] IndexedDB blocked or unavailable');
    };
    testDB.onsuccess = () => {
      indexedDB.deleteDatabase('test-db');
    };

    return true;

  } catch (error) {
    console.warn('[IndexedDB] IndexedDB not available:', error);
    return false;
  }
}

/**
 * ✅ NUEVO: Verificar y crear tablas faltantes dinámicamente
 * Esta función se puede llamar en cualquier momento para asegurar que todas las tablas existan
 */
export async function ensureTablesExist(): Promise<void> {
  try {
    console.log('[IndexedDB] 🔍 Verifying all required tables exist...');

    const db = await getDB();

    // Verificar solo las tablas que realmente usamos
    const missingTables: string[] = [];

    if (!db.objectStoreNames.contains('recursos')) missingTables.push('recursos');
    if (!db.objectStoreNames.contains('appConfig')) missingTables.push('appConfig');
    if (!db.objectStoreNames.contains('reportesOffline')) missingTables.push('reportesOffline');

    if (missingTables.length === 0) {
      console.log('[IndexedDB] ✅ All required tables exist');
      return;
    }

    console.log(`[IndexedDB] ⚠️ Missing tables detected: ${missingTables.join(', ')}`);
    console.log('[IndexedDB] 🔄 Attempting to create missing tables...');

    // Cerrar la conexión actual para forzar recreación
    db.close();
    dbInstance = null;

    // Incrementar versión para forzar upgrade
    const newVersion = DB_VERSION + 1;
    console.log(`[IndexedDB] ⬆️ Upgrading to version ${newVersion} to create missing tables`);

    // Reabrir con nueva versión (esto forzará el upgrade)
    dbInstance = await openDB<ActivosFijosDB>(DB_NAME, newVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`[IndexedDB] 🚀 Force upgrade from v${oldVersion} to v${newVersion}`);

        // Crear solo las tablas que realmente usamos
        if (!db.objectStoreNames.contains('recursos')) {
          console.log('[IndexedDB] Creating missing table: recursos');
          const recursosStore = db.createObjectStore('recursos', { keyPath: 'id' });
          recursosStore.createIndex('codigo', 'codigo');
          recursosStore.createIndex('nombre', 'nombre');
          recursosStore.createIndex('activo_fijo', 'activo_fijo');
          recursosStore.createIndex('expiresAt', 'expiresAt');
          console.log('[IndexedDB] ✅ Created table: recursos');
        }

        if (!db.objectStoreNames.contains('appConfig')) {
          console.log('[IndexedDB] Creating missing table: appConfig');
          db.createObjectStore('appConfig', { keyPath: 'key' });
          console.log('[IndexedDB] ✅ Created table: appConfig');
        }

        if (!db.objectStoreNames.contains('reportesOffline')) {
          console.log('[IndexedDB] Creating missing table: reportesOffline');
          const reportesStore = db.createObjectStore('reportesOffline', { keyPath: 'id' });
          reportesStore.createIndex('sync_status', 'sync_status');
          reportesStore.createIndex('fecha_creacion', 'fecha_creacion');
          reportesStore.createIndex('usuario_id', 'usuario_id');
          reportesStore.createIndex('fecha_sincronizacion', 'fecha_sincronizacion');
          console.log('[IndexedDB] ✅ Created table: reportesOffline');
        }
      },
    });

    console.log('[IndexedDB] 🎉 All missing tables created successfully');

  } catch (error) {
    console.error('[IndexedDB] ❌ Error ensuring tables exist:', error);
    throw error;
  }
}

/**
 * Guardar recursos en IndexedDB
 */
export async function saveRecursosToIndexedDB(recursos: any[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('recursos', 'readwrite');

    // Limpiar datos antiguos
    await tx.store.clear();

    // Guardar nuevos recursos con formato correcto
    const recursosFormateados = recursos.map(recurso => ({
      id: recurso.id,
      recurso_id: recurso.recurso_id,
      codigo: recurso.codigo || '',
      nombre: recurso.nombre || '',
      descripcion: recurso.descripcion || '',
      activo_fijo: Boolean(recurso.activo_fijo),
      unidad: recurso.unidad?.nombre || null,
      tipo_recurso: recurso.tipo_recurso?.nombre || null,
      lastFetched: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    }));

    await Promise.all(
      recursosFormateados.map(recurso => tx.store.put(recurso))
    );

    await tx.done;
    console.log(`[IndexedDB] Saved ${recursosFormateados.length} recursos`);
  } catch (error) {
    console.error('[IndexedDB] Error saving recursos:', error);
    throw error;
  }
}

/**
 * Obtener recursos desde IndexedDB
 */
export async function getRecursosFromIndexedDB(activoFijo?: boolean): Promise<any[]> {
  try {
    const db = await getDB();
    const now = Date.now();

    // Obtener recursos no expirados
    let recursos = await db.getAllFromIndex('recursos', 'expiresAt', IDBKeyRange.lowerBound(now));

    // Filtrar por activo_fijo si se especifica
    if (activoFijo !== undefined) {
      recursos = recursos.filter((r: any) => r.activo_fijo === activoFijo);
    }

    // Convertir de vuelta al formato original (opcional)
    return recursos.map(recurso => ({
      ...recurso,
      unidad: recurso.unidad ? { nombre: recurso.unidad } : undefined,
      tipo_recurso: recurso.tipo_recurso ? { nombre: recurso.tipo_recurso } : undefined
    }));
  } catch (error) {
    console.error('[IndexedDB] Error getting recursos:', error);
    return [];
  }
}


/**
 * Limpiar recursos expirados
 */
export async function clearExpiredRecursos(): Promise<number> {
  try {
    const db = await getDB();
    const tx = db.transaction('recursos', 'readwrite');
    const now = Date.now();

    // Obtener recursos expirados
    const expired = await tx.store.index('expiresAt').getAll(IDBKeyRange.upperBound(now));

    // Eliminarlos
    await Promise.all(
      expired.map(recurso => tx.store.delete(recurso.id))
    );

    await tx.done;
    console.log(`[IndexedDB] Cleared ${expired.length} expired recursos`);
    return expired.length;
  } catch (error) {
    console.error('[IndexedDB] Error clearing expired recursos:', error);
    return 0;
  }
}

/**
 * Guardar reporte offline en IndexedDB
 */
export const saveOfflineReport = async (reporteData: any): Promise<string> => {
  try {
    const db = await getDB();
    const reporteId = `reporte-offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Preparar datos del reporte offline
    const reporteOffline = {
      id: reporteId,
      titulo: reporteData.titulo,
      recursos: reporteData.recursos.map((recurso: any) => ({
        id_recurso: recurso.id_recurso,
        codigo_recurso: recurso.codigo_recurso,
        nombre_recurso: recurso.nombre_recurso,
        marca: recurso.marca,
        estado: recurso.estado,
        descripcion: recurso.descripcion,
        evidencia_urls: recurso.evidencia_urls || [],
        evidence_files: recurso.evidence_files || [] // Array de Blobs
      })),
      notas_generales: reporteData.notas_generales,
      usuario_id: reporteData.usuario_id,
      usuario_nombres: reporteData.usuario_nombres,
      fecha_creacion: Date.now(),
      fecha_sincronizacion: undefined, // undefined hasta que se sincronice
      sync_status: 'pending' as const,
      sync_error: undefined,
      version: 1,
      total_recursos: reporteData.recursos.length,
      total_imagenes: reporteData.recursos.reduce((sum: number, r: any) => sum + (r.evidence_files?.length || 0), 0)
    };

    await db.put('reportesOffline', reporteOffline);
    console.log(`[IndexedDB] ✅ Reporte offline guardado: ${reporteId}`);
    return reporteId;
  } catch (error) {
    console.error('[IndexedDB] Error saving reporte offline:', error);
    throw error;
  }
}

/**
 * Obtener todos los reportes offline
 */
export async function getReportesOffline(): Promise<any[]> {
  try {
    const db = await getDB();
    return await db.getAll('reportesOffline');
  } catch (error) {
    console.error('[IndexedDB] Error getting reportes offline:', error);
    return [];
  }
}

/**
 * Obtener reporte offline por ID
 */
export async function getReporteOfflineById(id: string): Promise<any | null> {
  try {
    const db = await getDB();
    return await db.get('reportesOffline', id);
  } catch (error) {
    console.error('[IndexedDB] Error getting reporte offline by id:', error);
    return null;
  }
}

/**
 * Obtener reportes offline por estado de sincronización
 */
export async function getReportesOfflineByStatus(status: 'pending' | 'synced' | 'error'): Promise<any[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('reportesOffline', 'sync_status', IDBKeyRange.only(status));
  } catch (error) {
    console.error('[IndexedDB] Error getting reportes offline by status:', error);
    return [];
  }
}

/**
 * Actualizar estado de sincronización de un reporte offline
 */
export async function updateReporteOfflineSyncStatus(
  id: string,
  status: 'pending' | 'synced' | 'error',
  error?: string
): Promise<void> {
  try {
    const db = await getDB();
    const reporte = await db.get('reportesOffline', id);

    if (reporte) {
      const updates = {
        sync_status: status,
        sync_error: error || undefined,
        fecha_sincronizacion: status === 'synced' ? Date.now() : reporte.fecha_sincronizacion
      };

      await db.put('reportesOffline', { ...reporte, ...updates });
      console.log(`[IndexedDB] ✅ Reporte ${id} actualizado: ${status}`);
    }
  } catch (error) {
    console.error('[IndexedDB] Error updating reporte offline sync status:', error);
    throw error;
  }
}

/**
 * Eliminar reporte offline
 */
export async function deleteReporteOffline(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('reportesOffline', id);
    console.log(`[IndexedDB] ✅ Reporte offline eliminado: ${id}`);
  } catch (error) {
    console.error('[IndexedDB] Error deleting reporte offline:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de reportes offline
 */
export async function getReportesOfflineStats(): Promise<{
  total: number;
  pending: number;
  synced: number;
  error: number;
}> {
  try {
    const reportes = await getReportesOffline();
    return {
      total: reportes.length,
      pending: reportes.filter(r => r.sync_status === 'pending').length,
      synced: reportes.filter(r => r.sync_status === 'synced').length,
      error: reportes.filter(r => r.sync_status === 'error').length
    };
  } catch (error) {
    console.error('[IndexedDB] Error getting reportes offline stats:', error);
    return { total: 0, pending: 0, synced: 0, error: 0 };
  }
}

// Exportar tipos para uso en otros módulos
export type { ActivosFijosDB };

// La función ya está exportada en su declaración
