'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, Package, Loader2, Plus, FileText, Calendar, User, Eye } from 'lucide-react';
import { SelectSearch } from '@/components/ui/select-search';
import ReporteActivoFijoForm from './components/reporte-activo-fijo-form';
import ReporteActivoFijoView from './components/reporte-activo-fijo-view';
import { useReportesPaginados } from '@/hooks';
import { ReporteActivoFijo } from '@/types/activos-fijos.types';

// Función para formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Función para obtener el nombre del activo(s)
const getNombreActivos = (recursos: ReporteActivoFijo['recursos']) => {
  if (!recursos || recursos.length === 0) return 'Sin activos';

  if (recursos.length === 1) {
    return recursos[0].nombre_recurso;
  }

  if (recursos.length <= 3) {
    return recursos.map(r => r.nombre_recurso).join(', ');
  }

  return `${recursos[0].nombre_recurso} y ${recursos.length - 1} más`;
};

// Función para determinar el estado del reporte basado en los recursos
const getEstadoReporte = (recursos: ReporteActivoFijo['recursos']) => {
  if (!recursos || recursos.length === 0) return 'Sin Recursos';

  const estados = recursos.map(r => r.estado);

  // Si hay algún recurso no encontrado
  if (estados.includes('No encontrado')) {
    return 'Incompleto';
  }

  // Si hay algún recurso inoperativo (crítico)
  if (estados.includes('Inoperativo')) {
    return 'Crítico';
  }

  // Si hay algún recurso observado (requiere atención)
  if (estados.includes('Observado')) {
    return 'Requiere Atención';
  }

  // Si todos son operativos
  if (estados.every(estado => estado === 'Operativo')) {
    return 'Completado';
  }

  // Estado por defecto
  return 'En Proceso';
};

// Componente para el badge de estado del reporte
const getEstadoBadge = (estado?: string) => {
  const status = estado || 'Completado';
  switch (status) {
    case 'Completado':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 whitespace-nowrap">
          Completado
        </span>
      );
    case 'Requiere Atención':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
          Requiere Atención
        </span>
      );
    case 'Crítico':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 whitespace-nowrap">
          Crítico
        </span>
      );
    case 'Incompleto':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 whitespace-nowrap">
          Incompleto
        </span>
      );
    case 'Sin Recursos':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 whitespace-nowrap">
          Sin Recursos
        </span>
      );
    case 'En Proceso':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap">
          En Proceso
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {status}
        </span>
      );
  }
};



// Componente principal del reporte
function ReporteRecursosContent() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: result, isLoading: loading, error } = useReportesPaginados({
    page: currentPage,
    limit: 20,
    sortBy: 'fecha_creacion',
    sortOrder: 'desc' as const
  });

  const reportes = result?.data || [];
  const paginationInfo = result?.pagination;
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingReporte, setViewingReporte] = useState<ReporteActivoFijo | null>(null);

  // Filtrar datos
  const filteredReportes = useMemo(() => {
    if (!reportes) return [];

    return reportes.filter((reporte) => {
      const matchesSearch =
        // Búsqueda por título
        reporte.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Búsqueda por ID del reporte
        reporte.id_reporte?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Búsqueda por nombre de usuario
        reporte.usuario_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Búsqueda por nombres de recursos/activos
        reporte.recursos?.some(recurso =>
          recurso.nombre_recurso?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recurso.codigo_recurso?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesSearch;
    });
  }, [reportes, searchQuery]);

  // Estadísticas básicas
  const estadisticas = useMemo(() => {
    if (!result) return { totalReportes: 0, totalRecursos: 0 };

    const totalRecursos = reportes.reduce((sum, reporte) => sum + (reporte.recursos?.length || 0), 0);

    return {
      totalReportes: paginationInfo?.total || 0,
      totalRecursos,
    };
  }, [result, reportes, paginationInfo]);

  const hasActiveFilters = searchQuery.trim().length > 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-md font-semibold text-[var(--text-primary)]">
            Reportes de Activos Fijos
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Historial de reportes generados del sistema
          </p>
        </div>

        {/* Botón Crear Nuevo Reporte */}
        <button
          onClick={() => setIsFormOpen(true)}
          className="h-8 px-3 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors duration-200 whitespace-nowrap"
        >
          <Plus className="h-3 w-3 inline mr-1" />
          Crear nuevo reporte
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
        <div className="flex flex-col gap-3">
          {/* Búsqueda general */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Buscar por ID, activos, título o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 text-xs w-full bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <div>
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center gap-1.5 h-8 px-3 py-1 rounded-lg bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200"
              >
                <X className="h-4 w-4" />
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-sm font-bold text-[var(--text-primary)]">{estadisticas.totalReportes}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Reportes</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-blue-600">{estadisticas.totalRecursos}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Recursos Evaluados</div>
          </div>
        </div>
      </div>

      {/* Listado de reportes */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-secondary)]">Cargando reportes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-12 text-center">
            <p className="text-xs text-red-500">Error al cargar los reportes</p>
          </div>
        ) : filteredReportes.length > 0 ? (
          <>
            {/* Tabla */}
            <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--surface)] border-b border-[var(--border)] table-header-shadow">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        ID Reporte
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Activos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Recursos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Fecha Creación
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredReportes.map((reporte) => (
                      <tr key={reporte._id} className="hover:bg-[var(--hover)]">
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)] font-medium">
                          {reporte.id_reporte}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)] max-w-48">
                          <div className="line-clamp-2">
                            {getNombreActivos(reporte.recursos)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)]">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {reporte.usuario_nombre || 'Usuario'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)]">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {reporte.recursos?.length || 0}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {getEstadoBadge(getEstadoReporte(reporte.recursos))}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="font-medium">{formatDate(reporte.fecha_creacion)}</span>
                            </div>
                            {reporte.fecha_sincronizacion && (
                              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                <Calendar className="h-2.5 w-2.5" />
                                <span className="text-[10px] font-medium">Sync: {formatDate(reporte.fecha_sincronizacion)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <button
                            onClick={() => setViewingReporte(reporte)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs text-[var(--text-secondary)]">
                    Página {paginationInfo.page} de {paginationInfo.totalPages} ({paginationInfo.total} reportes totales)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={paginationInfo.page === 1 || loading}
                      className="px-3 py-1 border border-[var(--border)] rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hover)]"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(paginationInfo.totalPages, currentPage + 1))}
                      disabled={paginationInfo.page === paginationInfo.totalPages || loading}
                      className="px-3 py-1 border border-[var(--border)] rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hover)]"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-[var(--text-secondary)]" />
            <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {hasActiveFilters ? 'No se encontraron reportes que coincidan con la búsqueda.' : 'No hay reportes registrados.'}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Crea tu primer reporte usando el botón "Crear nuevo reporte"
            </p>
          </div>
        )}
      </div>

      {/* Modal del formulario */}
      <ReporteActivoFijoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(data) => {
          console.log('Reporte generado:', data);
          // Aquí iría la lógica para procesar el reporte
        }}
      />

      {/* Modal de vista de detalles */}
      <ReporteActivoFijoView
        isOpen={!!viewingReporte}
        onClose={() => setViewingReporte(null)}
        reporte={viewingReporte}
      />
    </div>
  );
}

export default ReporteRecursosContent;