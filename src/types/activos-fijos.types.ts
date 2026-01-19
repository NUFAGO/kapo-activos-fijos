/**
 * 📊 TIPOS PARA ACTIVOS FIJOS
 *
 * Responsabilidad: Definir interfaces TypeScript para Activos Fijos
 * Flujo: Importado por hooks y componentes para type safety
 *
 * Sigue el patrón EXACTO de kapo-presupuestos - solo tipos, sin lógica de negocio
 */

export interface ActivoFijo {
  id_recurso: string;
  codigo_recurso: string;
  nombre_recurso: string;
  cantidad_recurso: number;
  costo_recurso: number;
  id_bodega: string;
  codigo_bodega: string;
  nombre_bodega: string;
  id_obra: string;
  nombre_obra: string;
  id_proyecto: string;
  nombre_proyecto: string;
  id_empresa: string;
  nombre_empresa: string;
  unidad_recurso_id?: string;
  unidad_recurso_nombre?: string;
  descripcion_recurso?: string;
  fecha_recurso?: string;
  vigente_recurso: boolean;
  usado_recurso: boolean;
  tipo_recurso_id?: string;
  clasificacion_recurso_id?: string;
  estado_recurso_almacen?: string;
}

export interface ActivosFijosPaginationInput {
  page?: number;
  itemsPage?: number;
  searchTerm?: string;
  filterRangeDate?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  };
  filterByBodega?: string;
  filterByProyecto?: string;
  filterByEstado?: 'vigente' | 'usado' | 'todos';
}

export interface ActivosFijosPaginationResult {
  info: {
    page: number;
    itemsPage: number;
    total: number;
    pages: number;
  };
  status: boolean;
  message: string;
  almacenActivosFijos: ActivoFijo[];
}

/**
 * Input para crear activo fijo
 */
export interface CreateActivoFijoInput {
  codigo_recurso: string;
  nombre_recurso: string;
  cantidad_recurso: number;
  costo_recurso: number;
  id_bodega: string;
  id_obra?: string;
  id_proyecto?: string;
  id_empresa?: string;
  unidad_recurso_id?: string;
  descripcion_recurso?: string;
  tipo_recurso_id?: string;
  clasificacion_recurso_id?: string;
}

/**
 * Input para actualizar activo fijo
 */
export interface UpdateActivoFijoInput {
  id: string;
  codigo_recurso?: string;
  nombre_recurso?: string;
  cantidad_recurso?: number;
  costo_recurso?: number;
  id_bodega?: string;
  id_obra?: string;
  id_proyecto?: string;
  id_empresa?: string;
  unidad_recurso_id?: string;
  descripcion_recurso?: string;
  vigente_recurso?: boolean;
  usado_recurso?: boolean;
  tipo_recurso_id?: string;
  clasificacion_recurso_id?: string;
}

/**
 * Estadísticas de activos fijos
 */
export interface EstadisticasActivosFijos {
  total_activos: number;
  activos_vigentes: number;
  activos_usados: number;
  total_valor: number;
  activos_por_bodega?: Array<{
    nombre_bodega: string;
    cantidad: number;
    valor_total: number;
  }>;
  activos_por_proyecto?: Array<{
    nombre_proyecto: string;
    cantidad: number;
    valor_total: number;
  }>;
}

/**
 * TIPOS PARA REPORTES DE ACTIVOS FIJOS
 */

export interface RecursoEvaluado {
  id_recurso: string;
  codigo_recurso: string;
  nombre_recurso: string;
  marca?: string;
  estado: 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado';
  descripcion: string;
  evidencia_urls: string[];
}

export interface ReporteActivoFijo {
  _id: string;
  id_reporte: string;
  titulo?: string;
  fecha_creacion: string;
  usuario_id: string;
  usuario_nombre: string;
  recursos: RecursoEvaluado[];
  notas_generales?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input para crear reporte
 */
export interface CrearReporteActivoFijoInput {
  titulo?: string;
  // usuario_id y usuario_nombre se obtienen automáticamente del contexto de autenticación
  recursos: {
    id_recurso: string;
    codigo_recurso: string;
    nombre_recurso: string;
    marca?: string;
    estado: 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado';
    descripcion: string;
    evidencia_urls: string[];
    evidence_files?: File[]; // Archivos específicos de este recurso
  }[];
  notas_generales?: string;
  // Para sincronización offline (no mostrar toast duplicado)
  esSincronizacionOffline?: boolean;
  // Removido: evidence_files global ya no se usa
}

/**
 * Input para actualizar reporte
 */
export interface ActualizarReporteActivoFijoInput {
  titulo?: string;
  recursos?: {
    id_recurso: string;
    codigo_recurso: string;
    nombre_recurso: string;
    marca?: string;
    estado: 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado';
    descripcion: string;
    evidencia_urls: string[];
    evidence_files?: File[]; // Archivos específicos de este recurso
  }[];
  notas_generales?: string;
  // Removido: evidence_files global ya no se usa
}

/**
 * Estadísticas de reportes
 */
export interface EstadisticasReportes {
  totalReportes: number;
  reportesPorMes: Array<{
    mes: string;
    cantidad: number;
  }>;
  estadosMasReportados: Array<{
    estado: string;
    cantidad: number;
  }>;
  recursosMasEvaluados: Array<{
    id: string;
    codigo: string;
    nombre: string;
    evaluaciones: number;
  }>;
}

/**
 * Historial de recurso
 */
export interface HistorialRecurso {
  recurso: {
    id: string;
    codigo: string;
    nombre: string;
  };
  historial: Array<{
    id_reporte: string;
    fecha: string;
    estado: string;
    descripcion: string;
    evidencia_urls: string[];
  }>;
}

/**
 * Paginación para reportes
 */
export interface ReportesPaginationInput {
  page?: number;
  limit?: number;
  filters?: {
    usuario_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado_recurso?: string;
  };
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportesPaginationResult {
  data: ReporteActivoFijo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}