/**
 * Queries GraphQL para Clasificaciones de Recurso
 */

// Query para obtener todas las clasificaciones de recurso
export const LIST_CLASIFICACIONES_RECURSO_QUERY = `
  query ListClasificacionRecurso {
    listClasificacionRecurso {
      id
      nombre
      parent_id
      childs {
        id
        nombre
        parent_id
        childs {
          id
          nombre
          parent_id
        }
      }
    }
  }
`;

// Query para obtener clasificaciones por parent_id
export const LIST_CLASIFICACIONES_BY_PARENT_QUERY = `
  query ListClasificacionRecursoByParentId($parentId: ID!) {
    listClasificacionRecursoByParentId(parentId: $parentId) {
      id
      nombre
      parent_id
      childs {
        id
        nombre
        parent_id
      }
    }
  }
`;