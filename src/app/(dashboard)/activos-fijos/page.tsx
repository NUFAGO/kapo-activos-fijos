'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useActivosFijos, usePageState } from '@/hooks';
import { ActivosFijosPaginationInput } from '@/types/activos-fijos.types';
import { Search, X, Package, Building2, CheckCircle2, AlertTriangle, Loader2, Eye, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import HistorialActivosFijosView from './components/historial-activos-fijos-view';

function ActivosFijosContent() {
  const { searchQuery, currentPage, setSearchQuery, setCurrentPage, clearFilters } = usePageState('activos-fijos');

  // Estado para el modal de historial
  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [selectedRecursoId, setSelectedRecursoId] = useState<string | null>(null);


  // Hook para obtener datos
  const queryParams: ActivosFijosPaginationInput = {
    page: currentPage,
    itemsPage: 20,
    searchTerm: searchQuery || undefined,
  };

  const { data, isLoading, error } = useActivosFijos(queryParams);

  const activos = data?.almacenActivosFijos || [];
  const paginationInfo = data?.info;

  // Estadísticas de ejemplo (valores fijos para demo)
  const estadisticas = {
    totalActivos: 20,
    activosVigentes: 20,
    activosUsados: 0,
    totalValor: '5,339.17'
  };

  const hasActiveFilters = searchQuery.trim().length > 0;

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('es-PE');
    } catch {
      return dateString;
    }
  };


  // Función para obtener el badge de estatus del activo
  const getEstatusBadge = (estado_recurso_almacen?: string) => {
    // Estados reales del backend
    const estadoMap = {
      'no asignado': { color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400', label: 'No asignado' },
      'pendiente reporte': { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', label: 'Pendiente Reporte' },
      'operativo': { color: 'bg-green-500/10 text-green-600 dark:text-green-400', label: 'Operativo' },
      'observado': { color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', label: 'Observado' },
      'inoperativo': { color: 'bg-red-500/10 text-red-600 dark:text-red-400', label: 'Inoperativo' },
      'no encontrado': { color: 'bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-200', label: 'No encontrado' }
    };

    // Valor por defecto si no existe
    const estadoActual = estado_recurso_almacen || 'no asignado';
    const estadoInfo = estadoMap[estadoActual as keyof typeof estadoMap] ||
      estadoMap['no asignado'];

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${estadoInfo.color} whitespace-nowrap`}>
        {estadoInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-md font-semibold text-[var(--text-primary)]">
            Activos Fijos
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Gestión y control de activos fijos del sistema
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
        <div className="flex flex-col gap-3">
          {/* Búsqueda general */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <Input
                type="text"
                placeholder="Buscar por código, nombre o bodega..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 text-xs w-full"
              />
            </div>
          </div>

          {/* Filtros temporales - Responsive */}
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            {/* Select Obra */}
            <select className="h-8 px-3 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)] min-w-0 flex-1 sm:flex-none sm:w-auto">
              <option value="">Todas las obras</option>
              <option value="obra1">Obra 1</option>
              <option value="obra2">Obra 2</option>
              <option value="obra3">Obra 3</option>
            </select>

            {/* Select Estatus */}
            <select className="h-8 px-3 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)] min-w-0 flex-1 sm:flex-none sm:w-auto">
              <option value="">Todos los estatus</option>
              <option value="operativo">Operativo</option>
              <option value="observado">Observado</option>
              <option value="inoperativo">Inoperativo</option>
              <option value="no-encontrado">No encontrado</option>
            </select>

            {/* Select Bodega */}
            <select className="h-8 px-3 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)] min-w-0 flex-1 sm:flex-none sm:w-auto">
              <option value="">Todas las bodegas</option>
              <option value="bodega1">Bodega 1</option>
              <option value="bodega2">Bodega 2</option>
              <option value="bodega3">Bodega 3</option>
            </select>

            {/* Botones */}
            <div className="flex gap-2 min-w-0 flex-1 sm:flex-none">
              {/* Botón Filtrar */}
              <button className="h-8 px-3 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors duration-200 flex-1 sm:flex-none">
                Filtrar
              </button>

              {/* Botón Limpiar */}
              <button className="h-8 px-3 py-1 text-xs bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-md transition-colors duration-200 flex-1 sm:flex-none">
                Limpiar
              </button>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <div>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 h-8 px-3 py-1 rounded-lg bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>



      {/* Listado de activos fijos */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-secondary)]">Cargando activos fijos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-12 text-center">
            <p className="text-xs text-red-500">Error al cargar los activos fijos</p>
          </div>
        ) : activos.length > 0 ? (
          <>
            {/* Tabla */}
            <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--surface)] border-b border-[var(--border)] table-header-shadow">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Código
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Valor Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Bodega
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Obra
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Estatus
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {activos.map((activo) => (
                      <tr key={activo.id_recurso} className="hover:bg-[var(--hover)] ">
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)] font-medium w-10">
                          {activo.codigo_recurso}
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--text-primary)] w-70">
                          <div className="line-clamp-2">
                            <div className="font-medium">{activo.nombre_recurso}</div>
                            {activo.descripcion_recurso && (
                              <div className="text-xs text-[var(--text-secondary)] mt-1">
                                {activo.descripcion_recurso}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)]">
                          {activo.cantidad_recurso} {activo.unidad_recurso_nombre}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)]">
                          {formatCurrency(activo.cantidad_recurso * activo.costo_recurso)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)] w-20">
                          <div>
                            <div className="font-medium">{activo.nombre_bodega}</div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              {activo.codigo_bodega}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--text-primary)] w-70">
                          <div className="line-clamp-2">
                            {activo.nombre_obra}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs w-20">
                          {getEstatusBadge(activo.estado_recurso_almacen)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-primary)] w-10">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecursoId(activo.id_recurso);
                                setHistorialModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Ver historial de reportes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {paginationInfo && paginationInfo.pages > 1 && (
              <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs text-[var(--text-secondary)]">
                    Página {paginationInfo.page} de {paginationInfo.pages} ({paginationInfo.total} activos totales)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={paginationInfo.page === 1 || isLoading}
                      className="px-3 py-1 border border-[var(--border)] rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hover)]"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(paginationInfo.pages, currentPage + 1))}
                      disabled={paginationInfo.page === paginationInfo.pages || isLoading}
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
            <p className="text-xs text-[var(--text-secondary)]">
              {hasActiveFilters
                ? 'No se encontraron activos fijos que coincidan con la búsqueda.'
                : 'No hay activos fijos registrados.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de historial de reportes */}
      <HistorialActivosFijosView
        isOpen={historialModalOpen}
        onClose={() => {
          setHistorialModalOpen(false);
          setSelectedRecursoId(null);
        }}
        recursoId={selectedRecursoId}
      />

    </div>
  );
}

export default function ActivosFijosPage() {
  return (
    <Suspense fallback={
      <div className="space-y-3">
        <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-12 text-center">
          <LoadingSpinner size={80} showText={true} text="Cargando..." />
        </div>
      </div>
    }>
      <ActivosFijosContent />
    </Suspense>
  );
}
