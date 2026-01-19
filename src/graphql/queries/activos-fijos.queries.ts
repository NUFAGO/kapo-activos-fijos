/**
 * Queries GraphQL para Activos Fijos
 */

export const LIST_ACTIVOS_FIJOS_PAGINADOS_QUERY = `
  query ListActivosFijosPaginados(
    $page: Int
    $itemsPage: Int
    $searchTerm: String
    $filterRangeDate: FilterRangeDateInput
  ) {
    listActivosFijosPaginados(input: {
      page: $page
      itemsPage: $itemsPage
      searchTerm: $searchTerm
      filterRangeDate: $filterRangeDate
    }) {
      info {
        page
        itemsPage
        total
        pages
      }
      status
      message
      almacenActivosFijos {
        id_recurso
        codigo_recurso
        nombre_recurso
        cantidad_recurso
        costo_recurso
        id_bodega
        codigo_bodega
        nombre_bodega
        id_obra
        nombre_obra
        id_proyecto
        nombre_proyecto
        id_empresa
        nombre_empresa
        unidad_recurso_id
        unidad_recurso_nombre
        descripcion_recurso
        fecha_recurso
        vigente_recurso
        usado_recurso
          tipo_recurso_id
          clasificacion_recurso_id
          estado_recurso_almacen
        }
    }
  }
`;

/**
 *  QUERIES PARA REPORTES DE ACTIVOS FIJOS
 */

// Listar todos los reportes
export const LIST_REPORTES_ACTIVOS_FIJOS_QUERY = `
  query ListReportesActivosFijos {
    listReportesActivosFijos {
      _id
      id_reporte
      titulo
      fecha_creacion
      usuario_id
      usuario_nombre
      recursos {
        id_recurso
        codigo_recurso
        nombre_recurso
        marca
        estado
        descripcion
        evidencia_urls
      }
      notas_generales
      created_at
      updated_at
    }
  }
`;

// Obtener reporte por ID
export const GET_REPORTE_ACTIVO_FIJO_QUERY = `
  query GetReporteActivoFijo($id: String!) {
    getReporteActivoFijo(id: $id) {
      _id
      id_reporte
      titulo
      fecha_creacion
      usuario_id
      usuario_nombre
      recursos {
        id_recurso
        codigo_recurso
        nombre_recurso
        marca
        estado
        descripcion
        evidencia_urls
      }
      notas_generales
      created_at
      updated_at
    }
  }
`;

// Obtener reporte por ID de reporte
export const GET_REPORTE_ACTIVO_FIJO_POR_ID_QUERY = `
  query GetReporteActivoFijoPorId($id_reporte: String!) {
    getReporteActivoFijoPorId(id_reporte: $id_reporte) {
      _id
      id_reporte
      titulo
      fecha_creacion
      usuario_id
      usuario_nombre
      recursos {
        id_recurso
        codigo_recurso
        nombre_recurso
        marca
        estado
        descripcion
        evidencia_urls
      }
      notas_generales
      created_at
      updated_at
    }
  }
`;

// Obtener reportes por usuario
export const GET_REPORTES_BY_USUARIO_QUERY = `
  query GetReportesByUsuario($id_usuario: String!) {
    getReportesActivosFijosByUsuario(id_usuario: $id_usuario) {
      _id
      id_reporte
      titulo
      fecha_creacion
      usuario_id
      usuario_nombre
      recursos {
        id_recurso
        codigo_recurso
        nombre_recurso
        marca
        estado
        descripcion
        evidencia_urls
      }
      notas_generales
      created_at
      updated_at
    }
  }
`;

// Obtener reportes por recurso
export const GET_REPORTES_BY_RECURSO_QUERY = `
  query GetReportesByRecurso($id_recurso: String!) {
    getReportesActivosFijosByRecurso(id_recurso: $id_recurso) {
      _id
      id_reporte
      titulo
      fecha_creacion
      usuario_id
      usuario_nombre
      recursos {
        id_recurso
        codigo_recurso
        nombre_recurso
        marca
        estado
        descripcion
        evidencia_urls
      }
      notas_generales
      created_at
      updated_at
    }
  }
`;

// Obtener historial de recurso
export const GET_HISTORIAL_RECURSO_QUERY = `
  query GetHistorialRecurso($id_recurso: String!) {
    getHistorialRecurso(id_recurso: $id_recurso) {
      recurso {
        id
        codigo
        nombre
      }
      historial {
        id_reporte
        fecha
        estado
        descripcion
        evidencia_urls
      }
    }
  }
`;

// Obtener estadísticas de reportes
export const GET_ESTADISTICAS_REPORTES_QUERY = `
  query GetEstadisticasReportes {
    estadisticasReportes {
      totalReportes
      reportesPorMes {
        mes
        cantidad
      }
      estadosMasReportados {
        estado
        cantidad
      }
      recursosMasEvaluados {
        id
        codigo
        nombre
        evaluaciones
      }
    }
  }
`;

// Listar reportes con paginación
export const LIST_REPORTES_PAGINADOS_QUERY = `
  query ListReportesPaginados($input: PaginationFilterInput!) {
    listReportesActivosFijosPaginated(input: $input) {
      data {
        _id
        id_reporte
        titulo
        fecha_creacion
        usuario_id
        usuario_nombre
        recursos {
          id_recurso
          codigo_recurso
          nombre_recurso
          marca
          estado
          descripcion
          evidencia_urls
        }
        notas_generales
        created_at
        updated_at
      }
      pagination {
        page
        limit
        total
        totalPages
        hasNext
        hasPrev
      }
    }
  }
`;

export const GET_ACTIVO_FIJO_QUERY = `
  query GetActivoFijo($id: String!) {
    getActivoFijo(id: $id) {
      id_recurso
      codigo_recurso
      nombre_recurso
      cantidad_recurso
      costo_recurso
      id_bodega
      codigo_bodega
      nombre_bodega
      id_obra
      nombre_obra
      id_proyecto
      nombre_proyecto
      id_empresa
      nombre_empresa
      unidad_recurso_id
      unidad_recurso_nombre
      descripcion_recurso
      fecha_recurso
      vigente_recurso
      usado_recurso
      tipo_recurso_id
      clasificacion_recurso_id
      estado_recurso_almacen
    }
  }
`;