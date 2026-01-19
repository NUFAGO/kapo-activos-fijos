import { GraphQLClient } from 'graphql-request';
import { apolloClient } from './apollo-client';
import { API_URL } from '@/lib/constants';
import { getAuthToken } from '@/lib/cookies';
import { DocumentNode } from 'graphql';
import { gql } from '@apollo/client';

/**
 * Cliente GraphQL configurado con autenticación
 * Basado en el patrón de kapo-presupuestos
 */
export const graphqlClient = new GraphQLClient(API_URL, {
  headers: () => {
    const token = typeof window !== 'undefined' ? getAuthToken() : undefined;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },
});

/**
 * Ejecuta una query GraphQL
 */
export async function executeQuery<T = any>(
  query: string | DocumentNode,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const data = await graphqlClient.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error('GraphQL Error:', error);
    throw error;
  }
}

/**
 * Ejecuta una mutation GraphQL
 */
export async function executeMutation<T = any>(
  mutation: string | DocumentNode,
  variables?: Record<string, any>
): Promise<T> {
  return executeQuery<T>(mutation, variables);
}

/**
 * Ejecuta una mutation GraphQL usando Apollo Client (para archivos)
 */
export async function executeMutationWithFiles<T = any>(
  mutation: DocumentNode,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const { data } = await apolloClient.mutate<T>({
      mutation,
      variables,
    });
    return data as T;
  } catch (error) {
    console.error('Apollo GraphQL Mutation Error:', error);
    throw error;
  }
}
