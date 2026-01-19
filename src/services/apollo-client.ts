import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
// @ts-ignore
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { API_URL } from '@/lib/constants';
import { getAuthToken } from '@/lib/cookies';

// Link de error para manejo de errores
const errorLink = new ErrorLink((error: any) => {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(({ message, locations, path }: any) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }

  if (error.networkError) {
    console.error(`[Network error]: ${error.networkError}`);
  }
});

// Upload link oficial de Apollo para archivos GraphQL
const uploadLink = new UploadHttpLink({
  uri: API_URL,
  headers: typeof window !== 'undefined' && getAuthToken()
    ? { authorization: `Bearer ${getAuthToken()}` }
    : {},
});

// Cliente Apollo configurado
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, uploadLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

