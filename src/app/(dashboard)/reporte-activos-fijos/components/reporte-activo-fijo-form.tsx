'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Modal from '@/components/ui/modal';
import { SelectSearch } from '@/components/ui/select-search';
import { Search, Camera, Plus, Trash2, User, Calendar, Clock, AlertTriangle, CheckCircle, FileText, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateReporteActivoFijo, useAuth, useRecursosActivosFijosOptions } from '@/hooks';
import { executeQuery } from '@/services/graphql-client';
import { LIST_RECURSOS_ACTIVOS_FIJOS_QUERY, GET_RECURSO_ACTIVO_FIJO_QUERY } from '@/graphql/queries/recursos.queries';

interface ReporteActivoFijoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

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
const ESTADOS_DISPONIBLES = [
  { value: 'Operativo', label: 'Operativo' },
  { value: 'Observado', label: 'Observado' },
  { value: 'Inoperativo', label: 'Inoperativo' },
  { value: 'No encontrado', label: 'No encontrado' },
];

// Los recursos activos fijos ahora se obtienen dinámicamente desde el backend
// usando el hook useRecursosActivosFijosOptions

export default function ReporteActivoFijoForm({
  isOpen,
  onClose,
  onSubmit,
}: ReporteActivoFijoFormProps) {
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<RecursoSeleccionado[]>([]);

  // Estado del recurso que se está buscando
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<string | null>(null);

  // Key para forzar re-renderizado del SelectSearch cuando se limpia
  const [searchKey, setSearchKey] = useState(0);

  // Ya no necesitamos el ref, usamos las opciones directamente

  // Hooks
  const { user } = useAuth();
  const createReporteMutation = useCreateReporteActivoFijo();

  // Patrón híbrido: datos iniciales + búsqueda opcional
  const { options: opcionesRecursosIniciales, isLoading: isLoadingRecursos } = useRecursosActivosFijosOptions();

  // Estado para opciones de búsqueda (solo cuando el usuario busca)
  const [opcionesBusqueda, setOpcionesBusqueda] = useState<Array<{ value: string; label: string; data?: any }>>([]);

  // Las opciones que se pasan al SelectSearch: siempre incluir iniciales + búsqueda
  // Esto asegura que cualquier opción seleccionada esté siempre disponible
  const opcionesRecursos = React.useMemo(() => {
    // Combinar iniciales y búsqueda, eliminando duplicados por value
    const todasOpciones = [...opcionesRecursosIniciales, ...opcionesBusqueda];
    const opcionesUnicas = todasOpciones.filter((opcion, index, self) =>
      index === self.findIndex(o => o.value === opcion.value)
    );
    return opcionesUnicas;
  }, [opcionesRecursosIniciales, opcionesBusqueda]);



  // Función de búsqueda opcional
  const buscarRecursosActivosFijos = useCallback(async (searchTerm: string): Promise<Array<{ value: string; label: string }>> => {
    // Si el término de búsqueda está vacío, NO limpiar opciones de búsqueda para mantener
    // disponibles las opciones que ya se encontraron, especialmente la seleccionada
    if (!searchTerm.trim()) {
      // Solo devolver las opciones iniciales para mostrar, pero mantener las de búsqueda
      return opcionesRecursosIniciales.map(opt => ({ value: opt.value, label: opt.label }));
    }

    try {
      const response = await executeQuery<{ listRecursosActivosFijos: any }>(
        LIST_RECURSOS_ACTIVOS_FIJOS_QUERY,
        {
          input: {
            page: 1,
            itemsPage: 50,
            searchTerm: searchTerm || undefined,
            activo_fijo: true,
          }
        }
      );

      if (response?.listRecursosActivosFijos?.recursos) {
        // Crear opciones de búsqueda para que el SelectSearch pueda mostrar el label correcto
        const opcionesBusquedaNuevas = response.listRecursosActivosFijos.recursos.map((r: any) => {
          const codigo = r.codigo ? `${r.codigo} - ` : '';
          const nombre = r.nombre || '';
          return {
            value: r.id,
            label: `${codigo}${nombre}`,
            data: r,
          };
        });

        // Agregar nuevas opciones de búsqueda a las existentes (sin duplicados)
        // Esto mantiene disponibles las opciones que ya se encontraron
        setOpcionesBusqueda(prevBusqueda => {
          const combinadas = [...prevBusqueda, ...opcionesBusquedaNuevas];
          const unicas = combinadas.filter((opcion, index, self) =>
            index === self.findIndex(o => o.value === opcion.value)
          );
          return unicas;
        });

        return response.listRecursosActivosFijos.recursos.map((r: any) => {
          const codigo = r.codigo ? `${r.codigo} - ` : '';
          const nombre = r.nombre || '';
          return {
            value: r.id,
            label: `${codigo}${nombre}`,
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Error al buscar recursos activos fijos:', error);
      return [];
    }
  }, []); // No necesitamos dependencias ya que manejamos estado local

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setRecursoSeleccionado(null);
      setOpcionesBusqueda([]); // Limpiar opciones de búsqueda solo al cerrar modal
      setSearchKey(0); // Resetear la key del SelectSearch
    }
  }, [isOpen]);

  // Función para obtener información completa del recurso
  const obtenerRecursoCompleto = async (recursoId: string) => {
    // Primero intentar desde las opciones disponibles
    const opcionSeleccionada = opcionesRecursos.find(opt => opt.value === recursoId);
    if (opcionSeleccionada?.data) {
      return opcionSeleccionada.data;
    }

    // Si no está en las opciones, hacer consulta directa
    try {
      const response = await executeQuery<{ getRecursoActivoFijo: any }>(
        GET_RECURSO_ACTIVO_FIJO_QUERY,
        { id: recursoId }
      );

      if (response?.getRecursoActivoFijo) {
        return response.getRecursoActivoFijo;
      }
    } catch (error) {
      console.error('Error consultando recurso:', error);
    }

    return null;
  };

  // Agregar recurso a la lista
  const agregarRecurso = async () => {
    if (!recursoSeleccionado) {
      toast.error('Selecciona un recurso primero');
      return;
    }

    // Verificar si ya está seleccionado
    if (recursosSeleccionados.find(r => r.id === recursoSeleccionado)) {
      toast.error('Este recurso ya está seleccionado');
      return;
    }

    // Obtener la información completa del recurso
    const recursoCompleto = await obtenerRecursoCompleto(recursoSeleccionado);

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
    setOpcionesBusqueda([]); // Limpiar opciones de búsqueda para resetear el componente
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
      // Preparar datos para GraphQL - archivos por recurso
      const reporteData = {
        titulo: `Reporte de Activos Fijos - ${new Date().toLocaleDateString('es-PE')}`,
        recursos: recursosSeleccionados.map(recurso => {
          // Verificar que todos los archivos de este recurso sean válidos
          const invalidFiles = recurso.fotos.filter(file => !(file instanceof File));
          if (invalidFiles.length > 0) {
            console.error('❌ Archivos inválidos encontrados en recurso:', recurso.codigo_recurso, invalidFiles);
            throw new Error(`Algunos archivos del recurso ${recurso.codigo_recurso} no son válidos`);
          }

          return {
            id_recurso: recurso.id,
            codigo_recurso: recurso.codigo_recurso,
            nombre_recurso: recurso.nombre_recurso,
            marca: recurso.marca,
            estado: recurso.status as 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado',
            descripcion: recurso.descripcion,
            evidencia_urls: [], // Las URLs se generarán desde los archivos subidos
            evidence_files: recurso.fotos // Archivos específicos de este recurso
          };
        }),
        notas_generales: `Reporte generado automáticamente con ${recursosSeleccionados.length} recursos evaluados.`,
        // Removido: evidence_files global ya no se usa
      };


      // Ejecutar la mutation (usuario_id y usuario_nombre se obtienen automáticamente del hook)
      await createReporteMutation.mutateAsync(reporteData);

      // Resetear formulario
      setRecursosSeleccionados([]);
      setRecursoSeleccionado(null);
      setOpcionesBusqueda([]);
      setSearchKey(0);
      onClose();

    } catch (error) {
      console.error('Error al crear reporte:', error);
      // El error ya se maneja en el hook con toast
    }
  };

  const handleClose = () => {
    if (!createReporteMutation.isPending) {
      setRecursosSeleccionados([]);
      setRecursoSeleccionado(null);
      setOpcionesBusqueda([]);
      setSearchKey(0);
      onClose();
    }
  };

  // Información del usuario y fecha
  const fechaActual = new Date();
  const diaSemana = fechaActual.toLocaleDateString('es-PE', { weekday: 'long' });
  const diaMes = fechaActual.getDate();
  const mes = fechaActual.toLocaleDateString('es-PE', { month: 'long' });
  const anio = fechaActual.getFullYear();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex text-[var(--text-secondary)] text-md items-center gap-2">
          <span>Reporte Activo Fijo</span>
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-xs text-[var(--text-secondary)]">
            {recursosSeleccionados.length} recurso{recursosSeleccionados.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={createReporteMutation.isPending}
              className="px-4 py-2 bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createReporteMutation.isPending || recursosSeleccionados.length === 0}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createReporteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                  Generando...
                </>
              ) : (
                'Generar'
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Información del usuario y fecha */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-[var(--card-bg)]/95 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden space-x-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Usuario:</span>
            <span className="text-xs text-[var(--text-secondary)]">{user?.nombresA || 'Usuario'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-primary)]">{`${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${diaMes} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${anio}`}</span>
          </div>
        </div>

        {/* Espacio separador */}
        <div className="h-2"></div>

        {/* Buscador de recursos - ALTURA FIJA */}
        <div className="space-y-1 pb-2">
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
                placeholder="Buscar recurso activo fijo..."
                className="w-full"
                isLoading={isLoadingRecursos}
                showSearchIcon={true}
                minCharsForSearch={2}
              />
            </div>
            <button
              onClick={() => agregarRecurso()}
              disabled={!recursoSeleccionado || !opcionesRecursos.some(opt => opt.value === recursoSeleccionado)}
              className="px-3 bg-green-500/10 hover:bg-green-500/20 text-xs text-green-600 dark:text-green-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0"
            >
              <Plus className="h-3 w-3" />
              Agregar
            </button>
          </div>
        </div>

        {/* Área expandible - OCUPA TODO EL RESTO */}
        <div className="flex-1 min-h-0 ">
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
            <div className="h-full flex items-center justify-center">
              <div className="text-center w-full">
                <Search className="mx-auto text-[var(--text-secondary)]" />
                <p className="mt-8 text-xs text-[var(--text-secondary)]">
                  Busca y selecciona recursos activos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
