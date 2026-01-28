import { gql } from '@apollo/client';

/**
 * Crear recursos desde offline (sincronización)
 */
export const CREATE_RECURSOS_FROM_OFFLINE_MUTATION = gql`
  mutation CreateRecursosFromOffline($recursos: [RecursoOfflineInput!]!) {
    createRecursosFromOffline(recursos: $recursos) {
      tempId
      realId
      codigoReal
    }
  }
`;
