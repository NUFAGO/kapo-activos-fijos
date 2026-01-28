'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, Package, Loader2, Plus, FileText, Calendar, User, Settings, DollarSign, Trash2 } from 'lucide-react';
import CrearRecursoForm from './components/crear-recurso-form';
import toast from 'react-hot-toast';
import { useUnidadesOffline } from '@/hooks/useUnidadesOffline';
import { useClasificacionesOffline } from '@/hooks/useClasificacionesOffline';
import { saveRecursoOffline, getRecursosOfflineFromIndexedDB } from '@/lib/db';

interface RecursoCreado {
  id: string;
  codigo?: string; // Código temporal del recurso
  nombre: string;
  descripcion: string;
  unidad: string;
  clasificacion: string;
  precioActual: string;
  fechaCreacion: string;
  createdAt: number;
  // Campos nuevos del esquema IndexedDB
  precio_actual?: number;
  clasificacion_recurso_id?: string;
  tipo_recurso_id?: string;
  tipo_costo_recurso_id?: string;
  vigente?: boolean;
  origen?: 'offline' | 'backend';
  unidad_id?: string;
  usado?: boolean;
  activo_fijo?: boolean;
  recurso_id?: string; // ID del recurso para backend
}

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

// Componente principal
function RecursosAFContent() {
  const [recursos, setRecursos] = useState<RecursoCreado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Cargar datos de unidades y clasificaciones para mapear nombres
  const { data: unidades } = useUnidadesOffline();
  const { data: clasificaciones } = useClasificacionesOffline();

  // Cargar recursos offline desde IndexedDB INMEDIATAMENTE (no esperar unidades/clasificaciones)
  useEffect(() => {
    const cargarRecursosOffline = async () => {
      setIsLoading(true);
      try {
        // Obtener SOLO recursos offline usando índice (MUY RÁPIDO, no espera sync)
        const recursosOffline = await getRecursosOfflineFromIndexedDB();

        
        // Mapear al formato esperado por la interfaz RecursoCreado
        const recursosFormateados = recursosOffline.map(r => {
          // Buscar nombre de la unidad (si ya está disponible, sino usar ID temporalmente)
          const unidadEncontrada = unidades?.find(u => u.id === r.unidad_id);
          const nombreUnidad = unidadEncontrada?.nombre || r.unidad || r.unidad_id || 'Cargando...';
          
          // Buscar nombre de la clasificación (si ya está disponible, sino usar ID temporalmente)
          const clasificacionEncontrada = clasificaciones?.find(c => c._id === r.clasificacion_recurso_id);
          const nombreClasificacion = clasificacionEncontrada?.nombre || r.clasificacion_recurso_id || 'Cargando...';
          
          return {
            id: r.id,
            codigo: r.codigo,
            recurso_id: r.recurso_id,
            nombre: r.nombre,
            descripcion: r.descripcion,
            unidad: nombreUnidad, // Nombre buscado desde el catálogo
            clasificacion: nombreClasificacion, // Nombre buscado desde el catálogo
            precioActual: r.precio_actual?.toString() || '0',
            fechaCreacion: new Date().toISOString(),
            createdAt: r.lastFetched || Date.now(),
            precio_actual: r.precio_actual,
            clasificacion_recurso_id: r.clasificacion_recurso_id,
            tipo_recurso_id: r.tipo_recurso_id,
            tipo_costo_recurso_id: r.tipo_costo_recurso_id,
            vigente: r.vigente,
            origen: r.origen,
            unidad_id: r.unidad_id,
            usado: r.usado,
            activo_fijo: r.activo_fijo,
          };
        });
        
        setRecursos(recursosFormateados);
      } catch (error) {
        console.error('[Recursos AF] Error cargando recursos:', error);
        toast.error('Error al cargar recursos offline');
        setRecursos([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarRecursosOffline();
  }, []); // Cargar inmediatamente, sin esperar dependencias
  
  // Actualizar nombres cuando unidades/clasificaciones estén disponibles
  useEffect(() => {
    if (!unidades || !clasificaciones || recursos.length === 0) return;
    
    setRecursos(prev => prev.map(r => ({
      ...r,
      unidad: unidades.find(u => u.id === r.unidad_id)?.nombre || r.unidad,
      clasificacion: clasificaciones.find(c => c._id === r.clasificacion_recurso_id)?.nombre || r.clasificacion,
    })));
  }, [unidades, clasificaciones]); // Actualizar cuando estén disponibles

  // Filtrar datos - Solo recursos creados offline
  const filteredRecursos = useMemo(() => {
    // Filtrar primero por origen 'offline', luego por búsqueda
    const recursosOffline = recursos.filter(recurso => recurso.origen === 'offline');

    return recursosOffline.filter((recurso) => {
      const matchesSearch =
        recurso.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recurso.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recurso.unidad?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recurso.clasificacion?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [recursos, searchQuery]);

  // Estadísticas - Solo de recursos offline
  const estadisticas = useMemo(() => {
    const recursosOffline = recursos.filter(r => r.origen === 'offline');
    const totalRecursos = recursosOffline.length;
    const totalUnidades = new Set(recursosOffline.map(r => r.unidad)).size;
    const totalClasificaciones = new Set(recursosOffline.map(r => r.clasificacion)).size;

    return {
      totalRecursos,
      totalUnidades,
      totalClasificaciones,
    };
  }, [recursos]);

  const hasActiveFilters = searchQuery.trim().length > 0;

  // Función para agregar un recurso (ahora async para guardar en IndexedDB)
  const agregarRecurso = async (recursoData: any) => {
    try {
      // Código temporal: TEMP- + 6 dígitos únicos
      const codigoTemporal = `TEMP-${Date.now().toString().slice(-6)}`;

      // Buscar nombre de la unidad seleccionada
      const unidadSeleccionada = unidades?.find(u => u.id === recursoData.unidadId);
      const nombreUnidad = unidadSeleccionada?.nombre || recursoData.unidadId;

      // Buscar nombre de la clasificación seleccionada
      const clasificacionSeleccionada = clasificaciones?.find(c => c._id === recursoData.clasificacionId);
      const nombreClasificacion = clasificacionSeleccionada?.nombre || recursoData.clasificacionId;

      const nuevoRecurso: RecursoCreado = {
        id: `recurso-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        codigo: codigoTemporal, // Código temporal generado
        recurso_id: codigoTemporal, // Usar el código temporal como recurso_id
        nombre: recursoData.nombre,
        descripcion: recursoData.descripcion,
        unidad: nombreUnidad, // Nombre de la unidad (no solo ID)
        clasificacion: nombreClasificacion, // Nombre de la clasificación (no solo ID)
        precioActual: recursoData.precioActual,
        fechaCreacion: new Date().toISOString(),
        createdAt: Date.now(),
        // Campos nuevos del esquema IndexedDB
        precio_actual: parseFloat(recursoData.precioActual), // Convertir a number
        clasificacion_recurso_id: recursoData.clasificacionId,
        unidad_id: recursoData.unidadId, // Campo consistente con backend
        tipo_recurso_id: "66e2075541a2c058b6fe80c4", // Hardcodeado
        tipo_costo_recurso_id: "670ee10b226d77acef76095c", // Hardcodeado
        vigente: true, // Hardcodeado
        activo_fijo: true, // Hardcodeado
        origen: 'offline', // Identifica que fue creado offline
        usado: false, // Default
      };

      // 1. Actualizar estado local (UI inmediata)
      setRecursos(prev => [...prev, nuevoRecurso]);

      // 2. Guardar en IndexedDB (persistencia)
      await saveRecursoOffline(nuevoRecurso);
      
      toast.success('Recurso creado y guardado exitosamente');
    } catch (error) {
      console.error('[Recursos AF] Error al guardar recurso:', error);
      toast.error('Error al guardar el recurso');
      // Revertir cambio en caso de error
      // Aquí podrías implementar lógica para remover el recurso del estado si falla IndexedDB
    }
  };

  // Función para eliminar un recurso
  const eliminarRecurso = (id: string) => {
    setRecursos(prev => prev.filter(r => r.id !== id));
    toast.success('Recurso eliminado');
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-md font-semibold text-[var(--text-primary)]">
            Recursos Activos Fijos
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Gestión de recursos de activos fijos offline
          </p>
        </div>

        {/* Botón Crear Nuevo Recurso */}
        <button
          onClick={() => setIsFormOpen(true)}
          className="h-8 px-3 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors duration-200 whitespace-nowrap"
        >
          <Plus className="h-3 w-3 inline mr-1" />
          Crear nuevo recurso
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              Buscar recursos
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-6 px-2 py-1 text-[10px] bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-md transition-colors duration-200 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre, descripción, unidad o clasificación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 px-3 py-1 text-xs bg-[var(--card-bg)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas - xs, p-1 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--background)] backdrop-blur-sm rounded card-shadow p-2 flex items-center justify-center sm:justify-between gap-1">
          <Package className="h-4 w-4 text-[var(--text-secondary)]" />
          <span className="hidden sm:inline text-xs text-[var(--text-primary)]">Total Recursos</span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {estadisticas.totalRecursos}
            <span className="hidden sm:inline text-xs text-[var(--text-secondary)] ml-0.5">recurso{estadisticas.totalRecursos !== 1 ? 's' : ''}</span>
          </span>
        </div>
        <div className="bg-[var(--background)] backdrop-blur-sm rounded card-shadow p-2 flex items-center justify-center sm:justify-between gap-1">
          <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
          <span className="hidden sm:inline text-xs text-[var(--text-primary)]">Unidades</span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {estadisticas.totalUnidades}
            <span className="hidden sm:inline text-xs text-[var(--text-secondary)] ml-0.5">diferente{estadisticas.totalUnidades !== 1 ? 's' : ''}</span>
          </span>
        </div>
        <div className="bg-[var(--background)] backdrop-blur-sm rounded card-shadow p-2 flex items-center justify-center sm:justify-between gap-1">
          <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
          <span className="hidden sm:inline text-xs text-[var(--text-primary)]">Clasificaciones</span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {estadisticas.totalClasificaciones}
            <span className="hidden sm:inline text-xs text-[var(--text-secondary)] ml-0.5">diferente{estadisticas.totalClasificaciones !== 1 ? 's' : ''}</span>
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-xs font-medium text-[var(--text-primary)]">
                Recursos ({filteredRecursos.length}{hasActiveFilters ? ` de ${recursos.length}` : ''})
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
              <span className="ml-2 text-xs text-[var(--text-secondary)]">Cargando recursos...</span>
            </div>
          ) : filteredRecursos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[var(--card-bg)] border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Código</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Nombre</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Unidad</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Precio</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Descripción</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Fecha Creación</th>
                    <th className="text-center p-3 font-medium text-[var(--text-secondary)]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecursos.map((recurso) => (
                    <tr key={recurso.id} className="border-b border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150">
                      <td className="p-3">
                        <div className="text-xs font-mono text-[var(--text-secondary)]">{recurso.codigo || '-'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-[var(--text-primary)]">{recurso.nombre}</div>
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">{recurso.unidad || '-'}</td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {recurso.precioActual}
                        </div>
                      </td>
                      <td className="p-3 text-[var(--text-secondary)] max-w-[200px] truncate" title={recurso.descripcion}>
                        {recurso.descripcion}
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        {formatDate(recurso.fechaCreacion)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => eliminarRecurso(recurso.id)}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors duration-150"
                          title="Eliminar recurso"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-[var(--text-secondary)]" />
              <h3 className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                {hasActiveFilters ? 'No se encontraron recursos' : 'No hay recursos creados'}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {hasActiveFilters
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza creando tu primer recurso'
                }
              </p>
              {!hasActiveFilters && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 h-8 px-3 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors duration-200"
                >
                  <Plus className="h-3 w-3 inline mr-1" />
                  Crear primer recurso
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal del formulario */}
      <CrearRecursoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={agregarRecurso}
      />
    </div>
  );
}

export default function RecursosAFOfflinePage() {
  return <RecursosAFContent />;
}