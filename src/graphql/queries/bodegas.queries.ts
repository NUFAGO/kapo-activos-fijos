/**
 * Queries GraphQL para Bodegas
 */

export const LIST_BODEGAS_QUERY = `
  query ListBodegas {
    listBodegas {
      _id
      codigo
      nombre
      obra_id
    }
  }
`;
