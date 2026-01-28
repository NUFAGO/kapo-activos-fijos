/**
 * Queries GraphQL para Unidades
 */

// Query para obtener todas las unidades
export const LIST_UNIDADES_QUERY = `
  query ListUnidad {
    listUnidad {
      id
      unidad_id
      nombre
      descripcion
    }
  }
`;