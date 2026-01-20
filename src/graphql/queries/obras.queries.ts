/**
 * Queries GraphQL para Obras
 */

export const LIST_OBRAS_QUERY = `
  query ListObras {
    listObras {
      _id
      nombre
      titulo
      id_proyecto
      empresa_id
    }
  }
`;
