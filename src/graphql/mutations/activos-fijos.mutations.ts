import { gql } from '@apollo/client';

/**
 * Mutations GraphQL para Activos Fijos
 * TODO: Implementar cuando se desarrollen los endpoints en backend
 */

// Placeholder para futuras implementaciones
export const CREATE_ACTIVO_FIJO_MUTATION = `
  mutation CreateActivoFijo($input: CreateActivoFijoInput!) {
    createActivoFijo(input: $input) {
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
      tipo_recurso_id
      clasificacion_recurso_id
    }
  }
`;

export const UPDATE_ACTIVO_FIJO_MUTATION = `
  mutation UpdateActivoFijo($input: UpdateActivoFijoInput!) {
    updateActivoFijo(input: $input) {
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
      tipo_recurso_id
      clasificacion_recurso_id
    }
  }
`;

export const DELETE_ACTIVO_FIJO_MUTATION = `
  mutation DeleteActivoFijo($id: String!) {
    deleteActivoFijo(id: $id) {
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
      tipo_recurso_id
      clasificacion_recurso_id
    }
  }
`;

// Placeholder para estadísticas
export const GET_ESTADISTICAS_ACTIVOS_FIJOS_QUERY = `
  query GetEstadisticasActivosFijos {
    getEstadisticasActivosFijos {
      total_activos
      activos_vigentes
      activos_usados
      total_valor
    }
  }
`;

// Query movida a archivo de queries correspondiente
// GET_ACTIVO_FIJO_QUERY ahora está en queries/activos-fijos.queries.ts

/**
 * MUTATIONS PARA REPORTES DE ACTIVOS FIJOS
 */

// Crear reporte de activo fijo
export const CREATE_REPORTE_ACTIVO_FIJO_MUTATION = gql`
  mutation CreateReporteActivoFijo(
    $titulo: String
    $usuario_id: String!
    $usuario_nombre: String!
    $recursos: [RecursoEvaluadoInput!]!
    $notas_generales: String
    $esSincronizacionOffline: Boolean
    $fecha_creacion: DateTime
  ) {
    addReporteActivoFijo(
      titulo: $titulo
      usuario_id: $usuario_id
      usuario_nombre: $usuario_nombre
      recursos: $recursos
      notas_generales: $notas_generales
      esSincronizacionOffline: $esSincronizacionOffline
      fecha_creacion: $fecha_creacion
    ) {
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

// Actualizar reporte de activo fijo
export const UPDATE_REPORTE_ACTIVO_FIJO_MUTATION = gql`
  mutation UpdateReporteActivoFijo(
    $id: String!
    $titulo: String
    $recursos: [RecursoEvaluadoInput!]
    $notas_generales: String
  ) {
    updateReporteActivoFijo(
      id: $id
      titulo: $titulo
      recursos: $recursos
      notas_generales: $notas_generales
    ) {
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

// Eliminar reporte de activo fijo
export const DELETE_REPORTE_ACTIVO_FIJO_MUTATION = gql`
  mutation DeleteReporteActivoFijo($id: String!) {
    deleteReporteActivoFijo(id: $id) {
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