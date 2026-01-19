/**
 * Queries GraphQL para Recursos
 */

// Listar recursos activos fijos para select search
// Query para obtener todos los recursos con filtros opcionales
export const LIST_ALL_RECURSOS_QUERY = `
  query ListAllRecursos($activoFijo: Boolean, $searchTerm: String) {
    listAllRecursos(activoFijo: $activoFijo, searchTerm: $searchTerm) {
      id
      recurso_id
      codigo
      nombre
      descripcion
      activo_fijo
      unidad {
        nombre
      }
      tipo_recurso {
        nombre
      }
      imagenes {
        id
        file
        fecha
      }
    }
  }
`;

export const LIST_RECURSOS_ACTIVOS_FIJOS_QUERY = `
  query ListRecursosActivosFijos($input: RecursosActivosFijosFilters) {
    listRecursosActivosFijos(input: $input) {
      info {
        page
        pages
        itemsPage
        total
      }
      status
      message
      recursos {
        id
        recurso_id
        codigo
        nombre
        descripcion
        activo_fijo
        unidad {
          nombre
        }
        tipo_recurso {
          nombre
        }
      }
    }
  }
`;

// Obtener recurso activo fijo por ID
export const GET_RECURSO_ACTIVO_FIJO_QUERY = `
  query GetRecursoActivoFijo($id: ID!) {
    getRecursoActivoFijo(id: $id) {
      id
      recurso_id
      codigo
      nombre
      descripcion
      fecha
      cantidad
      unidad_id
      unidad {
        id
        nombre
        simbolo
      }
      precio_actual
      vigente
      tipo_recurso_id
      tipo_recurso {
        id
        nombre
      }
      tipo_recurso_nombre
      tipo_costo_recurso_id
      tipo_costo_recurso {
        id
        nombre
        codigo
      }
      clasificacion_recurso_id
      clasificacion_recurso {
        id
        nombre
      }
      activo_fijo
      usado
      imagenes {
        id
        file
        fecha
      }
      combustible_ids
      estado_activo_fijo
      fecha_checked_activo_fijo
    }
  }
`;
