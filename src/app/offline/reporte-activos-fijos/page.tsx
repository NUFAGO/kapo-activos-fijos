'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SelectSearch } from '@/components/ui/select-search';
import { Search, Camera, Plus, Trash2, User, Calendar, Clock, AlertTriangle, CheckCircle, FileText, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks';
import { getRecursosFromIndexedDB, getDB } from '@/lib/db';
import { cn } from '@/lib/utils';

interface RecursoSeleccionado {
  id: string;
  codigo_recurso: string;
  nombre_recurso: string;
  marca: string;
  status: 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado';
  fotos: File[];
  descripcion: string;
}

// Estados disponibles
const ESTADOS_DISPONIBLES: Array<{ value: string; label: string; color: string }> = [
  { value: 'Operativo', label: 'Operativo', color: 'bg-emerald-500/80' },
  { value: 'Observado', label: 'Observado', color: 'bg-amber-500/80' },
  { value: 'Inoperativo', label: 'Inoperativo', color: 'bg-red-500/80' },
  { value: 'No encontrado', label: 'No encontrado', color: 'bg-slate-500/80' },
];

// Función para guardar reporte offline
const saveOfflineReport = async (reporteData: any): Promise<string> => {
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
      fecha_sincronizacion: undefined, // null hasta que se sincronice
      sync_status: 'pending' as const,
      sync_error: undefined,
      version: 1,
      total_recursos: reporteData.recursos.length,
      total_imagenes: reporteData.recursos.reduce((sum: number, r: any) => sum + (r.evidence_files?.length || 0), 0)
    };

    await db.put('reportesOffline', reporteOffline);
    console.log(`[Offline Report] ✅ Reporte guardado: ${reporteId}`);
    return reporteId;
  } catch (error) {
    console.error('[Offline Report] Error saving reporte offline:', error);
    throw error;
  }
};

// Los recursos activos fijos ahora se obtienen dinámicamente desde el backend
// usando el hook useRecursosActivosFijosOptions

export default function ReporteActivosFijosOfflinePage() {
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<RecursoSeleccionado[]>([]);

  // Estado del recurso que se está buscando
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<string | null>(null);

  // Key para forzar re-renderizado del SelectSearch cuando se limpia
  const [searchKey, setSearchKey] = useState(0);

  // Almacenar recursos completos para poder usarlos al seleccionar
  const recursosCompletosRef = useRef<Map<string, any>>(new Map());

  // Hooks
  const { user } = useAuth();


  // Estado para todas las opciones disponibles (cargadas desde IndexedDB)
  const [opcionesDisponibles, setOpcionesDisponibles] = useState<Array<{ value: string; label: string; data?: any }>>([]);

  // Estado para opciones filtradas (cuando el usuario busca)
  const [opcionesFiltradas, setOpcionesFiltradas] = useState<Array<{ value: string; label: string; data?: any }>>([]);

  // Las opciones que se pasan al SelectSearch: todas las disponibles inicialmente, filtradas cuando busca
  const opcionesRecursos = opcionesFiltradas.length > 0 ? opcionesFiltradas : opcionesDisponibles;

  // Cargar todos los recursos disponibles al iniciar el componente
  useEffect(() => {
    const cargarRecursosDisponibles = async () => {
      try {
        const recursos = await getRecursosFromIndexedDB();

        if (recursos && recursos.length > 0) {
          // Guardar recursos completos en el ref para acceso posterior
          recursos.forEach((r: any) => {
            recursosCompletosRef.current.set(r.id, r);
          });

          // Crear opciones disponibles
          const opciones = recursos.map((recurso: any) => {
            const codigo = recurso.codigo ? `${recurso.codigo} - ` : '';
            const nombre = recurso.nombre || '';
            return {
              value: recurso.id,
              label: `${codigo}${nombre}`,
              data: recurso,
            };
          });

          setOpcionesDisponibles(opciones);
        }
      } catch (error) {
        console.error('Error al cargar recursos desde IndexedDB:', error);
        toast.error('Error al cargar recursos disponibles');
      }
    };

    cargarRecursosDisponibles();
  }, []);


  // Función de búsqueda que filtra las opciones disponibles
  const buscarRecursosActivosFijos = useCallback(async (searchTerm: string): Promise<Array<{ value: string; label: string }>> => {
    try {
      if (!searchTerm.trim()) {
        // Si no hay término de búsqueda, mostrar todas las opciones disponibles
        setOpcionesFiltradas([]);
        return opcionesDisponibles.map(opcion => ({
          value: opcion.value,
          label: opcion.label,
        }));
      }

      // Filtrar las opciones disponibles por el término de búsqueda
      const searchLower = searchTerm.toLowerCase();
      const opcionesFiltradasNuevas = opcionesDisponibles.filter((opcion: any) => {
        const recurso = opcion.data;
        return (
          recurso.nombre?.toLowerCase().includes(searchLower) ||
          recurso.codigo?.toLowerCase().includes(searchLower) ||
          recurso.descripcion?.toLowerCase().includes(searchLower)
        );
      });

      // Actualizar estado de opciones filtradas
      setOpcionesFiltradas(opcionesFiltradasNuevas);

      return opcionesFiltradasNuevas.map(opcion => ({
        value: opcion.value,
        label: opcion.label,
      }));
    } catch (error) {
      console.error('Error al filtrar recursos:', error);
      toast.error('Error al buscar recursos');
      return [];
    }
  }, [opcionesDisponibles]);



  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    return () => {
      setRecursoSeleccionado(null);
      setOpcionesFiltradas([]); // Limpiar opciones filtradas solo al cerrar modal
      setSearchKey(0); // Resetear la key del SelectSearch
      recursosCompletosRef.current.clear();
    };
  }, []);

  // Agregar recurso a la lista
  const agregarRecurso = () => {
    if (!recursoSeleccionado) {
      toast.error('Selecciona un recurso primero');
      return;
    }

    // Verificar si ya está seleccionado
    if (recursosSeleccionados.find(r => r.id === recursoSeleccionado)) {
      toast.error('Este recurso ya está seleccionado');
      return;
    }

    // Obtener el recurso completo desde el ref
    const recursoCompleto = recursosCompletosRef.current.get(recursoSeleccionado);

    if (!recursoCompleto) {
      toast.error('No se pudo obtener la información completa del recurso');
      return;
    }

    // Usar datos del recurso completo
    const codigo = recursoCompleto.codigo || '';
    const nombre = recursoCompleto.nombre || '';

    const nuevoRecurso: RecursoSeleccionado = {
      id: recursoSeleccionado,
      codigo_recurso: codigo,
      nombre_recurso: nombre,
      marca: 'Marca Desconocida', // En datos reales vendría de la API
      status: null as any, // Inicia sin selección para mostrar placeholder
      fotos: [],
      descripcion: '',
    };

    setRecursosSeleccionados(prev => [...prev, nuevoRecurso]);
    setRecursoSeleccionado(null);
    setOpcionesFiltradas([]); // Limpiar opciones filtradas para resetear el componente
    setSearchKey(prev => prev + 1); // Forzar re-renderizado del SelectSearch
    toast.success('Recurso agregado al reporte');
  };

  // Actualizar status de un recurso
  const actualizarStatus = (id: string, status: RecursoSeleccionado['status']) => {
    setRecursosSeleccionados(prev =>
      prev.map(recurso =>
        recurso.id === id ? { ...recurso, status } : recurso
      )
    );
  };

  // Actualizar descripción de un recurso
  const actualizarDescripcion = (id: string, descripcion: string) => {
    setRecursosSeleccionados(prev =>
      prev.map(recurso =>
        recurso.id === id ? { ...recurso, descripcion } : recurso
      )
    );
  };

  // Manejar subida de fotos
  const manejarFotos = (id: string, files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    if (fileArray.length > 3) {
      toast.error('Máximo 3 fotos por recurso');
      return;
    }

    // Validar tipo y tamaño
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Cada imagen debe ser menor a 5MB');
        return;
      }
    }

    setRecursosSeleccionados(prev =>
      prev.map(recurso =>
        recurso.id === id ? { ...recurso, fotos: fileArray } : recurso
      )
    );
  };

  // Eliminar recurso de la lista
  const eliminarRecurso = (id: string) => {
    setRecursosSeleccionados(prev => prev.filter(r => r.id !== id));
    toast.success('Recurso removido del reporte');
  };

  // Verificar si hay recursos con estados críticos sin descripción
  const validarRecursosCriticos = () => {
    return recursosSeleccionados.every(recurso => {
      const estadoCritico = recurso.status === 'Inoperativo' || recurso.status === 'Observado';
      return !estadoCritico || (estadoCritico && recurso.descripcion.trim().length > 0);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recursosSeleccionados.length === 0) {
      toast.error('Debes seleccionar al menos un recurso');
      return;
    }

    // Validar que todos los recursos tengan status seleccionado
    const recursosSinStatus = recursosSeleccionados.filter(r => !r.status);
    if (recursosSinStatus.length > 0) {
      toast.error('Todos los recursos deben tener un estado seleccionado');
      return;
    }

    // Validar recursos críticos
    if (!validarRecursosCriticos()) {
      toast.error('Los recursos con estado "Inoperativo" o "Observado" requieren descripción');
      return;
    }

    // Validar que todos tengan al menos una foto
    const sinFotos = recursosSeleccionados.filter(r => r.fotos.length === 0);
    if (sinFotos.length > 0) {
      toast.error('Todos los recursos deben tener al menos una foto');
      return;
    }

    try {
      // Preparar datos para IndexedDB - convertir Files a Blobs
      const reporteData = {
        titulo: `Reporte de Activos Fijos - ${new Date().toLocaleDateString('es-PE')}`,
        recursos: recursosSeleccionados.map(recurso => {
          // Convertir Files a Blobs para IndexedDB
          const blobsPromises = recurso.fotos.map(async (file) => {
            if (file instanceof File) {
              return await file.arrayBuffer().then(buffer => new Blob([buffer], { type: file.type }));
            }
            return file; // Ya es Blob
          });

          return {
            id_recurso: recurso.id,
            codigo_recurso: recurso.codigo_recurso,
            nombre_recurso: recurso.nombre_recurso,
            marca: recurso.marca,
            estado: recurso.status as 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado',
            descripcion: recurso.descripcion,
            evidencia_urls: [], // Se generarán al sincronizar
            evidence_files: blobsPromises // Array de Promises que resuelven a Blobs
          };
        }),
        notas_generales: `Reporte generado automáticamente con ${recursosSeleccionados.length} recursos evaluados.`,
        usuario_id: user?.id,
        usuario_nombres: user?.nombresA
      };

      // Resolver todas las promesas de Blobs
      const recursosConBlobs = await Promise.all(
        reporteData.recursos.map(async (recurso) => ({
          ...recurso,
          evidence_files: await Promise.all(recurso.evidence_files)
        }))
      );

      const reporteFinal = {
        ...reporteData,
        recursos: recursosConBlobs
      };

      // Guardar en IndexedDB (NO sincroniza automáticamente)
      const reporteId = await saveOfflineReport(reporteFinal);

      toast.success(`Reporte guardado offline (ID: ${reporteId})`);


      // Resetear formulario
      setRecursosSeleccionados([]);
      setRecursoSeleccionado(null);
      setOpcionesFiltradas([]);
      setSearchKey(0);

    } catch (error) {
      console.error('Error al guardar reporte offline:', error);
      toast.error('Error al guardar el reporte offline');
    }
  };

  // Información del usuario y fecha
  const fechaActual = new Date();
  const diaSemana = fechaActual.toLocaleDateString('es-PE', { weekday: 'long' });
  const diaMes = fechaActual.getDate();
  const mes = fechaActual.toLocaleDateString('es-PE', { month: 'long' });
  const anio = fechaActual.getFullYear();

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Crear Reporte
          </h1>
          <p className="hidden sm:block text-xs text-[var(--text-secondary)] mt-0.5">
            Genera reportes de evaluación de activos fijos offline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {recursosSeleccionados.length} recurso{recursosSeleccionados.length !== 1 ? 's' : ''} seleccionado{recursosSeleccionados.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow overflow-hidden ">
        <div className="h-full p-4">
          <div className="h-full flex flex-col space-y-4">
            {/* Información del usuario y fecha */}
            <div className="hidden xs:flex xs:items-center xs:justify-between p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-secondary)]">Usuario:</span>
                <span className="text-xs text-[var(--text-secondary)] font-medium">{user?.nombresA || 'Usuario'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-primary)]">{`${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${diaMes} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${anio}`}</span>
              </div>
            </div>

            {/* Buscador de recursos - ALTURA FIJA */}
            <div className="space-y-1 pb-2 px-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  Buscar Recursos
                </span>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectSearch
                    key={searchKey}
                    value={recursoSeleccionado}
                    onChange={(recursoId) => {
                      setRecursoSeleccionado(recursoId);
                    }}
                    options={opcionesRecursos}
                    onSearch={buscarRecursosActivosFijos}
                    placeholder="Buscar recurso..."
                    className="w-full"
                    showSearchIcon={true}
                    minCharsForSearch={2}
                  />
                </div>
                <button
                  onClick={agregarRecurso}
                  disabled={!recursoSeleccionado}
                  className="px-3 bg-green-500/10 hover:bg-green-500/20 text-xs text-green-600 dark:text-green-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Área expandible - OCUPA TODO EL RESTO */}
            <div className="flex-1 min-h-0 overflow-y-auto border border-dashed rounded-lg p-2">
              {recursosSeleccionados.length > 0 ? (
                /* Lista de recursos seleccionados */
                <div className="h-full flex flex-col space-y-2">
                  <div className="flex items-center gap-2 pb-2">
                    <Package className="h-4 w-4 text-[var(--text-secondary)]" />
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      Recursos ({recursosSeleccionados.length})
                    </span>
                  </div>


                  {/* Lista scrollable que ocupa todo el resto */}
                  <div className="flex-1  space-y-2">
                    {recursosSeleccionados.map((recurso) => (
                      <div key={recurso.id} className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-[var(--card-bg)]/95 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden card-shadow hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.1)] hover:-translate-y-0.25 transition-all duration-300 p-3">
                        {/* Header del recurso */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-xs text-[var(--text-primary)] truncate">
                              {recurso.codigo_recurso}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">
                              {recurso.nombre_recurso}
                            </div>
                          </div>
                          <button
                            onClick={() => eliminarRecurso(recurso.id)}
                            className="text-red-500 hover:text-red-700 p-0.5 ml-2 flex-shrink-0"
                            title="Remover"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Layout principal: Estado arriba, fotos al lado, descripción abajo */}
                        <div className="space-y-3">
                          {/* Estado - Arriba */}
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <AlertTriangle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                                Estado del Recurso *
                              </label>
                              <Select
                                value={recurso.status}
                                onChange={(value) => actualizarStatus(recurso.id, value as RecursoSeleccionado['status'])}
                                options={ESTADOS_DISPONIBLES}
                                placeholder="Seleccionar estado"
                              />
                            </div>
                          </div>

                          {/* Fotos al costado - Mejor alineado */}
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Camera className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                                Evidencias Fotográficas * (1-3 fotos)
                              </label>
                              <div className="space-y-1">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => manejarFotos(recurso.id, e.target.files)}
                                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50 file:cursor-pointer file:transition-colors"
                                />
                                {recurso.fotos.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>{recurso.fotos.length} foto{recurso.fotos.length !== 1 ? 's' : ''} seleccionada{recurso.fotos.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Descripción - Abajo con mejor espaciado */}
                          <div className="flex items-start gap-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              recurso.status === 'Observado' || recurso.status === 'Inoperativo'
                                ? 'bg-red-50 dark:bg-red-900/20'
                                : 'bg-gray-50 dark:bg-gray-900/20'
                            }`}>
                              <FileText className={`h-3 w-3 ${
                                recurso.status === 'Observado' || recurso.status === 'Inoperativo'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                                Descripción {(recurso.status === 'Observado' || recurso.status === 'Inoperativo') && <span className="text-red-500">*</span>}
                              </label>
                              <Textarea
                                value={recurso.descripcion}
                                onChange={(e) => actualizarDescripcion(recurso.id, e.target.value)}
                                placeholder={
                                  recurso.status === 'Observado' ? "Describa la observación encontrada..." :
                                  recurso.status === 'Inoperativo' ? "Explique por qué está inoperativo..." :
                                  "Notas adicionales (opcional)..."
                                }
                                rows={2}
                                className="text-xs resize-none"
                                required={recurso.status === 'Observado' || recurso.status === 'Inoperativo'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Área vacía que ocupa TODO el espacio restante */
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center w-full">
                    <Search className="mx-auto text-[var(--text-secondary)] h-12 w-12" />
                    <p className="mt-8 text-xs text-[var(--text-secondary)]">
                      Busca y selecciona recursos activos
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2  flex-shrink-0">
              <button
                onClick={() => {
                  setRecursosSeleccionados([]);
                  setRecursoSeleccionado(null);
                  setOpcionesFiltradas([]);
                  setSearchKey(0);
                }}
                className="px-4 py-2 bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200 rounded-lg"
              >
                Limpiar
              </button>
              <button
                onClick={handleSubmit}
                disabled={recursosSeleccionados.length === 0}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Offline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
