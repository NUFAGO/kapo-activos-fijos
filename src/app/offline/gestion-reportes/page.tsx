'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, FileText, Eye, Package, User, Calendar, WifiOff, AlertCircle, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getDB, 
  getReporteOfflineById, 
  updateReporteOfflineSyncStatus,
  getRecursoById,
  replaceRecursoTempWithReal,
  replaceTempRefsInAllReportesOffline
} from '@/lib/db';
import { executeMutationWithFiles, executeMutation } from '@/services/graphql-client';
import { CREATE_REPORTE_ACTIVO_FIJO_MUTATION, CREATE_RECURSOS_FROM_OFFLINE_MUTATION } from '@/graphql/mutations';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useOnline } from '@/hooks';
import ReporteOfflineView from './components/reporte-view';
import ReporteOfflineEdit from './components/reporte-edit';

// Función para formatear fecha
const formatDate = (timestamp: number) => {
  try {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch {
    return 'Fecha inválida';
  }
};

// Función para obtener el nombre del activo(s)
const getNombreActivos = (recursos: any[]) => {
  if (!recursos || recursos.length === 0) return 'Sin activos';

  if (recursos.length === 1) {
    return recursos[0].nombre_recurso;
  }

  if (recursos.length <= 3) {
    return recursos.map(r => r.nombre_recurso).join(', ');
  }

  return `${recursos[0].nombre_recurso} y ${recursos.length - 1} más`;
};

const reporteHasRecursosOffline = (reporte: any) =>
  reporte?.recursos?.some((r: any) => r.codigo_recurso?.startsWith?.('TEMP-')) ?? false;

const MENSAJE_RECURSOS_OFFLINE =
  'Este informe tiene recursos creados offline. Puedes cambiar a recursos ya existentes o sincronizar para que se creen en el catálogo de recursos.';

// Función para cargar reportes offline desde IndexedDB
const loadOfflineReports = async (): Promise<any[]> => {
  try {
    const db = await getDB();
    const reportes = await db.getAll('reportesOffline');
    return reportes || [];
  } catch (error) {
    console.error('Error al cargar reportes offline:', error);
    return [];
  }
};

export default function GestionReportesOfflinePage() {
  const queryClient = useQueryClient();
  const { status: onlineStatus } = useOnline();
  const isOnline = onlineStatus === 'online';
  const [reportesOffline, setReportesOffline] = useState<any[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReporte, setEditingReporte] = useState<any>(null);
  const [syncingReportes, setSyncingReportes] = useState<Set<string>>(new Set());
  const [tooltipOffline, setTooltipOffline] = useState<{
    reporteId: string;
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const openTooltipOffline = (reporteId: string, el: HTMLElement) => {
    clearHideTimeout();
    const rect = el.getBoundingClientRect();
    setTooltipOffline({
      reporteId,
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 200),
    });
  };

  const hideTooltipDelayed = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => setTooltipOffline(null), 150);
  };

  const toggleTooltipOffline = (reporteId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (tooltipOffline?.reporteId === reporteId) {
      clearHideTimeout();
      setTooltipOffline(null);
      return;
    }
    openTooltipOffline(reporteId, e.currentTarget as HTMLElement);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (tooltipOffline && !t.closest('[data-tooltip-offline]') && !t.closest('[data-trigger-offline]')) {
        clearHideTimeout();
        setTooltipOffline(null);
      }
    };
    if (tooltipOffline) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [tooltipOffline]);

  useEffect(() => () => clearHideTimeout(), []);

  // Cargar reportes offline
  const cargarReportesOffline = async () => {
    setLoadingReportes(true);
    try {
      const reportes = await loadOfflineReports();
      // Ordenar por fecha de creación (más recientes primero)
      const reportesOrdenados = reportes.sort((a, b) => b.fecha_creacion - a.fecha_creacion);
      setReportesOffline(reportesOrdenados);
    } catch (error) {
      console.error('Error al cargar reportes offline:', error);
    } finally {
      setLoadingReportes(false);
    }
  };

  // Función para ver detalles del reporte
  const verDetalleReporte = async (reporteId: string) => {
    setTooltipOffline(null);
    try {
      const reporte = await getReporteOfflineById(reporteId);
      if (reporte) {
        setSelectedReporte(reporte);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error al cargar detalles del reporte:', error);
    }
  };

  // Función para abrir edición del reporte (solo pendientes)
  const abrirEditarReporte = async (reporteId: string) => {
    setTooltipOffline(null);
    try {
      const reporte = await getReporteOfflineById(reporteId);
      if (reporte && reporte.sync_status === 'pending') {
        setEditingReporte(reporte);
      }
    } catch (error) {
      console.error('Error al cargar reporte para editar:', error);
      toast.error('No se pudo abrir la edición');
    }
  };

  // Función para sincronizar un reporte individual
  const sincronizarReporte = async (reporteId: string) => {
    // Validar conexión antes de sincronizar
    if (!isOnline) {
      toast.error('Se requiere conexión a internet para sincronizar', {
        icon: <WifiOff className="w-5 h-5" />,
        duration: 3000,
      });
      return;
    }

    if (syncingReportes.has(reporteId)) return;

    setSyncingReportes(prev => new Set(prev).add(reporteId));

    try {
      const reporte = await getReporteOfflineById(reporteId);
      if (!reporte) {
        toast.error('Reporte no encontrado');
        return;
      }

      // PASO NUEVO: Detectar y resolver recursos offline
      const recursosOffline = reporte.recursos.filter((r: any) => 
        r.codigo_recurso?.startsWith('TEMP-')
      );

      if (recursosOffline.length > 0) {
        console.log(`[Sync] Detectados ${recursosOffline.length} recursos offline, creándolos...`);

        // Obtener datos completos de IndexedDB
        const recursosParaCrear = [];
        for (const recursoReporte of recursosOffline) {
          const recursoCompleto = await getRecursoById(recursoReporte.id_recurso);
          if (!recursoCompleto) {
            console.warn(`[Sync] Recurso offline ${recursoReporte.id_recurso} no encontrado en IndexedDB`);
            continue;
          }
          recursosParaCrear.push({
            tempId: recursoCompleto.id,
            nombre: recursoCompleto.nombre,
            descripcion: recursoCompleto.descripcion,
            precio_actual: recursoCompleto.precio_actual || 0,
            unidad_id: recursoCompleto.unidad_id,
            clasificacion_recurso_id: recursoCompleto.clasificacion_recurso_id,
            tipo_recurso_id: recursoCompleto.tipo_recurso_id,
            tipo_costo_recurso_id: recursoCompleto.tipo_costo_recurso_id,
            vigente: recursoCompleto.vigente ?? true,
            activo_fijo: recursoCompleto.activo_fijo ?? true,
            usado: recursoCompleto.usado ?? false,
          });
        }

        if (recursosParaCrear.length > 0) {
          // Llamar mutación para crear recursos en backend
          const resultadoCreacion = await executeMutation<{
            createRecursosFromOffline: Array<{ tempId: string; realId: string; codigoReal: string }>
          }>(CREATE_RECURSOS_FROM_OFFLINE_MUTATION, {
            recursos: recursosParaCrear
          });

          // Actualizar IndexedDB: recursos y reportes
          for (const mapping of resultadoCreacion.createRecursosFromOffline) {
            await replaceRecursoTempWithReal(mapping.tempId, mapping.realId, mapping.codigoReal);
            await replaceTempRefsInAllReportesOffline(mapping.tempId, mapping.realId, mapping.codigoReal);
          }

          console.log(`[Sync] ✅ ${recursosParaCrear.length} recursos offline creados y actualizados en IDB`);

          // Recargar reporte actualizado
          const reporteActualizado = await getReporteOfflineById(reporteId);
          if (!reporteActualizado) {
            throw new Error('Error recargando reporte actualizado');
          }
          // Usar reporte actualizado para el resto del sync
          Object.assign(reporte, reporteActualizado);
        }
      }

      // Convertir datos offline al formato online (ya con ids reales)
      const fechaCreacion = new Date(reporte.fecha_creacion);
      const datosOnline = {
        titulo: reporte.titulo,
        usuario_id: reporte.usuario_id,
        usuario_nombre: reporte.usuario_nombres,
        recursos: reporte.recursos.map((r: any) => ({
          id_recurso: r.id_recurso,
          codigo_recurso: r.codigo_recurso,
          nombre_recurso: r.nombre_recurso,
          marca: r.marca,
          estado: r.estado,
          descripcion: r.descripcion,
          evidencia_urls: r.evidencia_urls || [],
          evidence_files: r.evidence_files || [] // Incluir fotos guardadas offline
        })),
        notas_generales: reporte.notas_generales,
        esSincronizacionOffline: true, // Indica que viene de sincronización
        fecha_creacion: fechaCreacion.toISOString() // Mantener fecha original del offline
      };

      // Crear reporte en backend usando executeMutationWithFiles directamente
      const response = await executeMutationWithFiles<{ addReporteActivoFijo: any }>(
        CREATE_REPORTE_ACTIVO_FIJO_MUTATION,
        datosOnline
      );

      if (!response || !response.addReporteActivoFijo) {
        throw new Error(`Error en sincronización: respuesta inválida del servidor. Response: ${JSON.stringify(response)}`);
      }

      const reporteCreado = response.addReporteActivoFijo;

      // Actualizar estado en IndexedDB con fecha de sincronización
      const fechaSincronizacion = Date.now();
      await updateReporteOfflineSyncStatus(reporteId, 'synced');

      // Actualizar registro en IndexedDB con fecha_sincronizacion
      const db = await getDB();
      const reporteExistente = await db.get('reportesOffline', reporteId);
      if (reporteExistente) {
        await db.put('reportesOffline', {
          ...reporteExistente,
          sync_status: 'synced',
          fecha_sincronizacion: fechaSincronizacion
        });
      }

      // Actualizar lista local
      setReportesOffline(prev => prev.map(r =>
        r.id === reporteId ? {
          ...r,
          sync_status: 'synced',
          fecha_sincronizacion: fechaSincronizacion
        } : r
      ));

      toast.success('Reporte sincronizado exitosamente');

      // Invalidar queries relacionadas (igual que cuando se crea un reporte online)
      queryClient.invalidateQueries({ queryKey: ['reportes-activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-paginados'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-by-usuario'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-reportes'] });
      // Invalidar TODAS las queries relacionadas con activos fijos
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['recursos-activos-fijos'], exact: false });

    } catch (error: any) {
      console.error('Error sincronizando reporte:', error);

      // Marcar como error en IndexedDB
      await updateReporteOfflineSyncStatus(reporteId, 'error', error.message);

      // Actualizar lista local
      setReportesOffline(prev => prev.map(r =>
        r.id === reporteId ? { ...r, sync_status: 'error' } : r
      ));

      toast.error(`Error al sincronizar: ${error.message}`);
    } finally {
      setSyncingReportes(prev => {
        const newSet = new Set(prev);
        newSet.delete(reporteId);
        return newSet;
      });
    }
  };

  // Función para cerrar el modal
  const cerrarModal = () => {
    setIsModalOpen(false);
    setSelectedReporte(null);
  };

  // Cerrar view y abrir edición con el mismo reporte (desde aviso "Ir a cambiar esto")
  const irACambiar = () => {
    if (selectedReporte?.sync_status === 'pending') {
      setEditingReporte(selectedReporte);
      cerrarModal();
    }
  };

  // Cargar reportes al montar el componente
  useEffect(() => {
    cargarReportesOffline();
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Gestión de Reportes
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Reportes de activos fijos guardados offline pendientes de sincronización
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarReportesOffline}
            disabled={loadingReportes}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loadingReportes && "animate-spin")} />
            Refrescar
          </button>
          <span className="text-xs text-[var(--text-secondary)]">
            {reportesOffline.length} reporte{reportesOffline.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        {loadingReportes ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Cargando reportes...</p>
            </div>
          </div>
        ) : reportesOffline.length > 0 ? (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                    Recursos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reportesOffline.map((reporte) => (
                  <tr key={reporte.id} className="border-b border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150">
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        {reporte.sync_status === 'synced' && reporte.fecha_sincronizacion ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              Sync: {formatDate(reporte.fecha_sincronizacion)}
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              Creado: {formatDate(reporte.fecha_creacion)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-primary)] font-medium">
                            {formatDate(reporte.fecha_creacion)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-primary)] max-w-48">
                      <div className="line-clamp-2">
                        {getNombreActivos(reporte.recursos)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-primary)]">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {reporte.usuario_nombres || 'Usuario'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-primary)]">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {reporte.total_recursos || reporte.recursos?.length || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium',
                          reporte.sync_status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : reporte.sync_status === 'error'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-green-500/10 text-green-600 dark:text-green-400'
                        )}>
                          {reporte.sync_status === 'pending' ? 'Pendiente' :
                           reporte.sync_status === 'error' ? 'Error' : 'Sincronizado'}
                        </span>
                        {reporteHasRecursosOffline(reporte) && (
                          <button
                            type="button"
                            data-trigger-offline
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTooltipOffline(reporte.id, e);
                            }}
                            onMouseEnter={(e) => openTooltipOffline(reporte.id, e.currentTarget)}
                            onMouseLeave={hideTooltipDelayed}
                            className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors shrink-0"
                            aria-label="Recursos offline"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-1">
                        {reporte.sync_status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirEditarReporte(reporte.id);
                            }}
                            className="p-1 rounded hover:bg-[var(--hover)] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => verDetalleReporte(reporte.id)}
                          className="p-1 rounded hover:bg-[var(--hover)] text-blue-600 dark:text-blue-400 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => sincronizarReporte(reporte.id)}
                          disabled={syncingReportes.has(reporte.id) || reporte.sync_status === 'synced'}
                          className="p-1 rounded hover:bg-[var(--hover)] text-green-600 dark:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            reporte.sync_status === 'synced' 
                              ? 'Ya sincronizado' 
                              : 'Sincronizar'
                          }
                        >
                          <RefreshCw className={cn(
                            "h-4 w-4",
                            syncingReportes.has(reporte.id) && "animate-spin"
                          )} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-[var(--text-secondary)]" />
              <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                No hay reportes offline
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Crea un reporte en la sección "Reportes" para verlo aquí
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip recursos offline (portal) */}
      {tooltipOffline &&
        createPortal(
          <div
            data-tooltip-offline
            className="fixed z-[100] px-3 py-2 max-w-[280px] text-xs rounded-lg shadow-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)]"
            style={{
              left: tooltipOffline.left,
              top: tooltipOffline.top,
              minWidth: tooltipOffline.width,
            }}
            onMouseEnter={clearHideTimeout}
            onMouseLeave={hideTooltipDelayed}
          >
            <p>{MENSAJE_RECURSOS_OFFLINE}</p>
          </div>,
          document.body
        )}

      {/* Modal de detalles del reporte */}
      <ReporteOfflineView
        isOpen={isModalOpen}
        onClose={cerrarModal}
        reporte={selectedReporte}
        onIrACambiar={irACambiar}
      />

      {/* Modal de edición (solo pendientes) */}
      <ReporteOfflineEdit
        isOpen={!!editingReporte}
        onClose={() => setEditingReporte(null)}
        reporte={editingReporte}
        onSaved={cargarReportesOffline}
      />
    </div>
  );
}
