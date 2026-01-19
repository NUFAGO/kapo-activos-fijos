/**
 * ⚙️ CONSTANTES GLOBALES - CONFIGURACIÓN DE LA APP
 *
 * Responsabilidad: Valores fijos usados en toda la aplicación
 * Flujo: Importado por providers, hooks, servicios → Configuración global
 *
 * Configuración GraphQL:
 * - API_URL: http://localhost:8082/graphql (configurado en .env)
 * - Puerto 8082 para desarrollo local
 *
 * Contiene:
 * - URLs de API (GraphQL backend en puerto 8082)
 * - Nombres de cookies (autenticación)
 * - Configuración de cache (React Query)
 * - Tiempos de expiración
 */

// URL del backend GraphQL - Configurado via .env para puerto 8082
export const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8082/graphql';

export const AUTH_COOKIE_NAME = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';
export const SELECTED_ROLE_KEY = 'selectedRole';

export const TOKEN_EXPIRY_DAYS = 30;
export const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Configuración de React Query - Cache inteligente de datos
export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
  gcTime: 30 * 60 * 1000, // 30 minutos - tiempo antes de GC
  retry: 1, // Reintentar 1 vez en caso de error
  refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
} as const;
