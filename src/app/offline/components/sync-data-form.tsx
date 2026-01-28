'use client';

import React, { useState, useEffect } from 'react';
import { Database, Upload, Download, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { executeQuery } from '@/services/graphql-client';
import { LIST_ALL_RECURSOS_QUERY } from '@/graphql/queries/recursos.queries';
import { LIST_UNIDADES_QUERY } from '@/graphql/queries/unidades.queries';
import { LIST_CLASIFICACIONES_RECURSO_QUERY } from '@/graphql/queries/clasificaciones.queries';
import { saveRecursosToIndexedDB, getRecursosFromIndexedDB, saveUnidadesToIndexedDB, getUnidadesFromIndexedDB, saveClasificacionesToIndexedDB, getClasificacionesFromIndexedDB, isIDBAvailable, ensureTablesExist } from '@/lib/db';
import toast from 'react-hot-toast';

interface SyncDataFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SyncItem {
  id: string;
  type: 'upload' | 'download';
  title: string;
  description: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

export default function SyncDataForm({ isOpen, onClose }: SyncDataFormProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    available: boolean;
    recursos: { hasData: boolean; count: number };
    unidades: { hasData: boolean; count: number };
    clasificaciones: { hasData: boolean; count: number };
    totalData: number;
  }>({
    available: false,
    recursos: { hasData: false, count: 0 },
    unidades: { hasData: false, count: 0 },
    clasificaciones: { hasData: false, count: 0 },
    totalData: 0
  });

  // Verificar conexión a internet
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);


  // Función para verificar estado de IndexedDB
  const checkDBStatus = async () => {
    if (!isIDBAvailable()) {
      setDbStatus({
        available: false,
        recursos: { hasData: false, count: 0 },
        unidades: { hasData: false, count: 0 },
        clasificaciones: { hasData: false, count: 0 },
        totalData: 0
      });
      return;
    }

    try {
      // Asegurar que las tablas existan antes de verificar
      await ensureTablesExist();

      const [recursos, unidades, clasificaciones] = await Promise.all([
        getRecursosFromIndexedDB(),
        getUnidadesFromIndexedDB(),
        getClasificacionesFromIndexedDB()
      ]);

      const totalData = recursos.length + unidades.length + clasificaciones.length;

      setDbStatus({
        available: true,
        recursos: { hasData: recursos.length > 0, count: recursos.length },
        unidades: { hasData: unidades.length > 0, count: unidades.length },
        clasificaciones: { hasData: clasificaciones.length > 0, count: clasificaciones.length },
        totalData
      });
    } catch (error) {
      console.error('Error checking DB status:', error);
      setDbStatus({
        available: false,
        recursos: { hasData: false, count: 0 },
        unidades: { hasData: false, count: 0 },
        clasificaciones: { hasData: false, count: 0 },
        totalData: 0
      });
    }
  };

  // Función para rellenar IndexedDB con datos frescos
  const populateIndexedDB = async () => {
    try {
      // PRIMERO: Asegurar que todas las tablas existan
      console.log('Verifying IndexedDB tables...');
      await ensureTablesExist();

      console.log('Consultando datos desde API...');

      // Consultar todos los catálogos en paralelo
      const [recursosResult, unidadesResult, clasificacionesResult] = await Promise.all([
        executeQuery(LIST_ALL_RECURSOS_QUERY, { activoFijo: true }),
        executeQuery(LIST_UNIDADES_QUERY, {}),
        executeQuery(LIST_CLASIFICACIONES_RECURSO_QUERY, {})
      ]);

      const recursos = recursosResult.listAllRecursos || [];
      const unidades = unidadesResult.listUnidad || [];
      const clasificaciones = clasificacionesResult.listClasificacionRecurso || [];

      console.log(`📊 Datos obtenidos - Recursos: ${recursos.length}, Unidades: ${unidades.length}, Clasificaciones: ${clasificaciones.length}`);
      console.log('📋 Jerarquía original:', clasificaciones.map((c: any) => `${c.nombre} (${c.childs?.length || 0} hijos)`));

      // Filtrar y formatear recursos con IDs válidos
      const recursosValidos = recursos.filter((r: any) => r.id != null && r.id !== undefined && r.id !== '');
      console.log(`✅ Recursos válidos: ${recursosValidos.length}/${recursos.length}`);
      const recursosFormateados = recursos
        .filter((r: any) => r.id != null && r.id !== undefined && r.id !== '')
        .map((r: any) => ({
          id: String(r.id),
          recurso_id: r.recurso_id,
          codigo: r.codigo,
          nombre: r.nombre,
          descripcion: r.descripcion,
          activo_fijo: r.activo_fijo,
          unidad: r.unidad,
          tipo_recurso: r.tipo_recurso,
          lastFetched: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
        }));

      await saveRecursosToIndexedDB(recursosFormateados);
      console.log(`✅ Guardados ${recursosFormateados.length} recursos en IndexedDB`);

      // Filtrar y formatear unidades con IDs válidos
      const unidadesValidas = unidades.filter((u: any) => u.id != null && u.id !== undefined && u.id !== '');
      console.log(`✅ Unidades válidas: ${unidadesValidas.length}/${unidades.length}`);

      const unidadesFormateadas = unidadesValidas.map((u: any) => ({
        id: String(u.id),
        unidad_id: u.unidad_id,
        nombre: u.nombre || '',
        descripcion: u.descripcion || '',
        lastFetched: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
      }));

      await saveUnidadesToIndexedDB(unidadesFormateadas);
      console.log(`✅ Guardadas ${unidadesFormateadas.length} unidades en IndexedDB`);

      // Guardar TODAS las clasificaciones del backend como registros planos
      const todasLasClasificaciones: any[] = [];

      const extractAllClasificaciones = (clases: any[]) => {
        clases.forEach((clas: any) => {
          // Solo guardar clasificaciones con ID válido
          if (clas.id != null && clas.id !== undefined && clas.id !== '') {
            todasLasClasificaciones.push({
              _id: String(clas.id),
              nombre: clas.nombre,
              parent_id: clas.parent_id || null,
              __v: clas.__v || 0,
              lastFetched: Date.now(),
              expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
            });
          }

          // Procesar hijos recursivamente
          if (clas.childs && clas.childs.length > 0) {
            extractAllClasificaciones(clas.childs);
          }
        });
      };

      extractAllClasificaciones(clasificaciones);
      console.log(`📊 Extraídas ${todasLasClasificaciones.length} clasificaciones del backend para guardar en IndexedDB`);

      // Filtrar clasificaciones válidas (deberían tener _id válido)
      const clasificacionesValidas = todasLasClasificaciones.filter((c: any) => c._id != null && c._id !== undefined && c._id !== '');
      console.log(`✅ Clasificaciones válidas: ${clasificacionesValidas.length}/${todasLasClasificaciones.length}`);

      await saveClasificacionesToIndexedDB(clasificacionesValidas);
      console.log(`Guardadas ${clasificacionesValidas.length} clasificaciones en IndexedDB`);

      const totalRegistros = recursosFormateados.length + unidadesFormateadas.length + clasificacionesValidas.length;

      // Actualizar estado
      setDbStatus({
        available: true,
        recursos: { hasData: recursosFormateados.length > 0, count: recursosFormateados.length },
        unidades: { hasData: unidadesFormateadas.length > 0, count: unidadesFormateadas.length },
        clasificaciones: { hasData: clasificacionesValidas.length > 0, count: clasificacionesValidas.length },
        totalData: totalRegistros
      });

      return totalRegistros;
    } catch (error) {
      console.error('❌ Error rellenando IndexedDB:', error);
      throw error;
    }
  };

  // Cargar última sincronización del localStorage
  useEffect(() => {
    const lastSync = localStorage.getItem('last_sync_date');
    if (lastSync) {
      setLastSyncDate(lastSync);
    }
  }, []);

  // Verificar estado de DB cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      checkDBStatus();
    }
  }, [isOpen]);

  // Cargar items de sincronización - Todos los catálogos
  useEffect(() => {
    if (isOpen) {
      const realSyncItems: SyncItem[] = [
        {
          id: 'recursos-sync',
          type: 'download',
          title: 'Catálogo de Recursos',
          description: dbStatus.available && dbStatus.recursos.hasData
            ? `${dbStatus.recursos.count} recursos disponibles`
            : 'Catálogo completo de recursos listo para descargar y trabajar sin conexión',
          status: 'pending' // ✅ Siempre permite actualizar
        },
        {
          id: 'unidades-sync',
          type: 'download',
          title: 'Catálogo de Unidades',
          description: dbStatus.available && dbStatus.unidades.hasData
            ? `${dbStatus.unidades.count} unidades disponibles`
            : 'Catálogo completo de unidades listo para descargar y trabajar sin conexión',
          status: 'pending' // ✅ Siempre permite actualizar
        },
        {
          id: 'clasificaciones-sync',
          type: 'download',
          title: 'Catálogo de Clasificaciones',
          description: dbStatus.available && dbStatus.clasificaciones.hasData
            ? `${dbStatus.clasificaciones.count} clasificaciones disponibles`
            : 'Catálogo completo de clasificaciones listo para descargar y trabajar sin conexión',
          status: 'pending' // ✅ Siempre permite actualizar
        }
      ];
      setSyncItems(realSyncItems);
    }
  }, [isOpen, dbStatus]);

  const handleSyncAll = async () => {
    if (!isOnline) {
      alert('No hay conexión a internet. Verifica tu conexión e intenta nuevamente.');
      return;
    }

    setIsSyncing(true);

    try {
      // Procesar cada item de sincronización
      for (let i = 0; i < syncItems.length; i++) {
        const item = syncItems[i];

        // Actualizar estado a sincronizando
        setSyncItems(prev => prev.map(si =>
          si.id === item.id ? { ...si, status: 'syncing' as const, progress: 0 } : si
        ));

        try {
          // Simular progreso mientras se ejecuta la tarea real
          for (let progress = 0; progress <= 90; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setSyncItems(prev => prev.map(si =>
              si.id === item.id ? { ...si, progress } : si
            ));
          }

          // Ejecutar sincronización según el tipo de catálogo
          if (item.id === 'recursos-sync') {
            const count = await populateIndexedDB();
            setSyncItems(prev => prev.map(si =>
              si.id === item.id ? {
                ...si,
                description: `Catálogo de recursos actualizado`,
                progress: 100,
                status: 'completed' as const
              } : si
            ));
          } else if (item.id === 'unidades-sync') {
            // Las unidades ya se sincronizan en populateIndexedDB
            setSyncItems(prev => prev.map(si =>
              si.id === item.id ? {
                ...si,
                description: `Catálogo de unidades actualizado`,
                progress: 100,
                status: 'completed' as const
              } : si
            ));
          } else if (item.id === 'clasificaciones-sync') {
            // Las clasificaciones ya se sincronizan en populateIndexedDB
            setSyncItems(prev => prev.map(si =>
              si.id === item.id ? {
                ...si,
                description: `Catálogo de clasificaciones actualizado`,
                progress: 100,
                status: 'completed' as const
              } : si
            ));
          }

        } catch (error) {
          console.error(`Error sincronizando ${item.id}:`, error);
          setSyncItems(prev => prev.map(si =>
            si.id === item.id ? {
              ...si,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Error desconocido'
            } : si
          ));
        }
      }

      // Actualizar fecha de última sincronización
      const now = new Date().toISOString();
      localStorage.setItem('last_sync_date', now);
      setLastSyncDate(now);

      // Mostrar toast de éxito
      toast.success('Sincronización completada exitosamente');

    } catch (error) {
      console.error('Error en sincronización general:', error);
      alert('Error durante la sincronización: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncItem = async (itemId: string) => {
    if (!isOnline) {
      alert('No hay conexión a internet.');
      return;
    }

    const item = syncItems.find(si => si.id === itemId);
    if (!item || item.status === 'completed') return;

    setSyncItems(prev => prev.map(si =>
      si.id === itemId ? { ...si, status: 'syncing' as const, progress: 0 } : si
    ));

    try {
      // Simular progreso inicial
      for (let progress = 0; progress <= 80; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setSyncItems(prev => prev.map(si =>
          si.id === itemId ? { ...si, progress } : si
        ));
      }

      // Ejecutar sincronización según el tipo de catálogo
      if (itemId === 'recursos-sync' || itemId === 'unidades-sync' || itemId === 'clasificaciones-sync') {
        const count = await populateIndexedDB();
        const catalogName = itemId === 'recursos-sync' ? 'recursos' :
                           itemId === 'unidades-sync' ? 'unidades' : 'clasificaciones';
        setSyncItems(prev => prev.map(si =>
          si.id === itemId ? {
            ...si,
            description: `Catálogo de ${catalogName} actualizado`,
            progress: 100,
            status: 'completed' as const
          } : si
        ));
      }

    } catch (error) {
      console.error(`Error sincronizando ${itemId}:`, error);
      setSyncItems(prev => prev.map(si =>
        si.id === itemId ? {
          ...si,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Error desconocido'
        } : si
      ));
    }
  };

  const getStatusIcon = (status: SyncItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SyncItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'syncing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatLastSync = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Nunca';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-sm sm:text-base md:text-lg">Estado de Catálogos</span>}
      size="md"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center">
          <div className="text-xs text-[var(--text-secondary)] text-center sm:text-left">
            {syncItems.length} catálogo{syncItems.length !== 1 ? 's' : ''} disponible{syncItems.length !== 1 ? 's' : ''} • {dbStatus.totalData} registros totales
          </div>
          <div className="flex gap-2 sm:gap-3 justify-center sm:justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200 rounded-lg"
            >
              Cerrar
            </button>
            <button
              onClick={handleSyncAll}
              disabled={!isOnline || isSyncing}
              className="px-3 sm:px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Sincronizando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sincronizar Todos</span>
                  <span className="sm:hidden">Sincronizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Estado de Conexión e IndexedDB */}
        <div className="p-3 sm:p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Estado de Conexión */}
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isOnline ? (
                    <Database className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                    {isOnline ? 'Conectado' : 'Sin conexión'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {isOnline ? 'Listo para actualizar' : 'Se requiere conexión'}
                  </p>
                </div>
              </div>

              {/* Estado de IndexedDB */}
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${dbStatus.available ? (dbStatus.totalData > 0 ? 'bg-blue-100' : 'bg-yellow-100') : 'bg-red-100'}`}>
                  {dbStatus.available ? (
                    dbStatus.totalData > 0 ? (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-xs font-medium text-[var(--text-primary)]">
                    <span className="hidden sm:inline">
                      {dbStatus.totalData} registros ({dbStatus.recursos.count}R, {dbStatus.unidades.count}U, {dbStatus.clasificaciones.count}C)
                    </span>
                    <span className="sm:hidden">
                      {dbStatus.totalData} reg.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Última sync */}
            <div className="text-left sm:text-right">
              <p className="text-xs text-[var(--text-secondary)]">Última sync</p>
              <p className="text-xs sm:text-xs font-medium text-[var(--text-primary)]">
                {lastSyncDate ? formatLastSync(lastSyncDate) : 'Nunca'}
              </p>
            </div>
          </div>
        </div>

        {/* Catálogos Disponibles */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm sm:text-md text-[var(--text-primary)]">Catálogos Disponibles</h4>

          <div className="space-y-3">
            {syncItems.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.type === 'upload' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {item.type === 'upload' ? (
                        <Upload className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Download className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm sm:text-md text-[var(--text-primary)] truncate">{item.title}</h5>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 sm:line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusIcon(item.status)}
                    <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'completed' ? 'Disponible' :
                       item.status === 'syncing' ? 'Sincronizando...' :
                       item.status === 'error' ? 'Error' : 'Listo para sync'}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                {item.status === 'syncing' && item.progress !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Error message */}
                {item.status === 'error' && item.error && (
                  <p className="text-xs text-red-600 mb-2">{item.error}</p>
                )}

                {/* Botón de actualización individual - Siempre visible cuando hay conexión */}
                {isOnline && !isSyncing && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSyncItem(item.id)}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg whitespace-nowrap"
                    >
                      {item.status === 'completed' ? 'Sincronizar' : 'Sincronizar Ahora'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}
