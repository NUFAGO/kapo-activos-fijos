'use client';

import React, { useState, useEffect } from 'react';
import { Database, Upload, Download, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { executeQuery } from '@/services/graphql-client';
import { LIST_ALL_RECURSOS_QUERY } from '@/graphql/queries/recursos.queries';
import { saveRecursosToIndexedDB, getRecursosFromIndexedDB, isIDBAvailable, ensureTablesExist } from '@/lib/db';
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
  const [dbStatus, setDbStatus] = useState<{ available: boolean; hasData: boolean; dataCount: number }>({
    available: false,
    hasData: false,
    dataCount: 0
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
      setDbStatus({ available: false, hasData: false, dataCount: 0 });
      return;
    }

    try {
      // Asegurar que las tablas existan antes de verificar
      await ensureTablesExist();

      const recursos = await getRecursosFromIndexedDB();
      setDbStatus({
        available: true,
        hasData: recursos.length > 0,
        dataCount: recursos.length
      });
    } catch (error) {
      console.error('Error checking DB status:', error);
      setDbStatus({ available: false, hasData: false, dataCount: 0 });
    }
  };

  // Función para rellenar IndexedDB con datos frescos
  const populateIndexedDB = async () => {
    try {
      // PRIMERO: Asegurar que todas las tablas existan
      console.log('Verifying IndexedDB tables...');
      await ensureTablesExist();

      console.log('Consultando recursos desde API...');
      const variables: any = {
        activoFijo: true
      };
      // Solo descargar recursos activos fijos
      // variables.searchTerm = undefined; // Sin filtro de búsqueda
      const result = await executeQuery(LIST_ALL_RECURSOS_QUERY, variables);
      const recursos = result.listAllRecursos || [];

      console.log('Convirtiendo formato para IndexedDB...');
      const recursosFormateados = recursos.map((r: any) => ({
        id: r.id,
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

      console.log('💾 Guardando en IndexedDB...');
      await saveRecursosToIndexedDB(recursosFormateados);

      console.log(`✅ Guardados ${recursosFormateados.length} recursos en IndexedDB`);

      // Actualizar estado
      setDbStatus({
        available: true,
        hasData: true,
        dataCount: recursosFormateados.length
      });

      return recursosFormateados.length;
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

  // Cargar items de sincronización - Solo un apartado principal
  useEffect(() => {
    if (isOpen) {
      const realSyncItems: SyncItem[] = [
        {
          id: 'recursos-sync',
          type: 'download',
          title: 'Catálogo de Recursos',
          description: dbStatus.available && dbStatus.hasData
            ? `Catálogo disponible con ${dbStatus.dataCount} recursos - puedes actualizar cuando quieras`
            : 'Catálogo completo de recursos listo para descargar y trabajar sin conexión',
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

          // Ejecutar sincronización de recursos
          if (item.id === 'recursos-sync') {
            const count = await populateIndexedDB();
            setSyncItems(prev => prev.map(si =>
              si.id === item.id ? {
                ...si,
                description: `✅ Catálogo actualizado (${count} recursos descargados)`,
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

      // Ejecutar sincronización de recursos
      if (itemId === 'recursos-sync') {
        const count = await populateIndexedDB();
        setSyncItems(prev => prev.map(si =>
          si.id === itemId ? {
            ...si,
            description: `✅ Catálogo actualizado (${count} recursos descargados)`,
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
      title="Estado de Catálogos"
      size="lg"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-xs text-[var(--text-secondary)]">
            {syncItems.length} catálogo{syncItems.length !== 1 ? 's' : ''} disponible{syncItems.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200 rounded-lg"
            >
              Cerrar
            </button>
            <button
              onClick={handleSyncAll}
              disabled={!isOnline || isSyncing}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Actualizar Catálogos
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Estado de Conexión e IndexedDB */}
        <div className="space-y-3">
          {/* Estado de Conexión */}
          <div className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                {isOnline ? (
                  <Database className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-md text-[var(--text-primary)]">
                  {isOnline ? 'Conectado' : 'Sin conexión'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isOnline ? 'Listo para actualizar' : 'Se requiere conexión'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)]">Última sync</p>
              <p className="text-xs font-medium text-[var(--text-primary)]">
                {lastSyncDate ? formatLastSync(lastSyncDate) : 'Nunca'}
              </p>
            </div>
          </div>

          {/* Estado de IndexedDB */}
          <div className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${dbStatus.available ? (dbStatus.hasData ? 'bg-blue-100' : 'bg-yellow-100') : 'bg-red-100'}`}>
                {dbStatus.available ? (
                  dbStatus.hasData ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-md text-[var(--text-primary)]">
                  IndexedDB {dbStatus.available ? (dbStatus.hasData ? 'Con Datos' : 'Vacía') : 'No Disponible'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {dbStatus.available
                    ? `${dbStatus.dataCount} recursos almacenados`
                    : 'Base de datos no disponible'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Catálogos Disponibles */}
        <div className="space-y-3">
          <h4 className="font-medium text-md text-[var(--text-primary)]">Catálogos Disponibles</h4>

          <div className="space-y-3">
            {syncItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.type === 'upload' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {item.type === 'upload' ? (
                        <Upload className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Download className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-medium text-md text-[var(--text-primary)]">{item.title}</h5>
                      <p className="text-xs text-[var(--text-secondary)]">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'completed' ? 'Disponible' :
                       item.status === 'syncing' ? 'Actualizando...' :
                       item.status === 'error' ? 'Error' : 'Listo para sync'}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                {item.status === 'syncing' && item.progress !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Error message */}
                {item.status === 'error' && item.error && (
                  <p className="text-xs text-red-600 mt-2">{item.error}</p>
                )}

                {/* Botón de actualización individual - Siempre visible cuando hay conexión */}
                {isOnline && !isSyncing && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSyncItem(item.id)}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg"
                    >
                      {item.status === 'completed' ? 'Actualizar de Nuevo' : 'Actualizar Ahora'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Información adicional - Estado de catálogos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-md text-blue-800 mb-1">Estado de Catálogos</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Revisa el estado de tus catálogos de recursos disponibles</li>
                <li>• Los datos se actualizan automáticamente cada 24 horas</li>
                <li>• Consulta recursos activos incluso sin conexión a internet</li>
                <li>• Actualiza manualmente cuando necesites - ¡puedes hacerlo en cualquier momento!</li>
                <li>• Perfecto para trabajar en campo o zonas con conexión limitada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
