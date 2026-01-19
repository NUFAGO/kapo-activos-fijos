/**
 * 🔄 PROVIDERS GLOBALES - CONTEXTO DE LA APLICACIÓN
 *
 * Responsabilidad: Proporcionar estado global y configuración a toda la app
 * Flujo: Envuelve componentes → Proporciona React Query, Toasts, etc.
 *
 * Contiene:
 * - QueryClient: Cache de datos, loading states (React Query)
 * - Toaster: Sistema de notificaciones globales
 * - [Futuro] AuthProvider, ThemeProvider, etc.
 */

/**
 * 🔄 PROVIDERS GLOBALES - CONTEXTO DE LA APLICACIÓN
 *
 * Responsabilidad: Proporcionar estado global y configuración a toda la app
 * Flujo: Envuelve componentes → Proporciona React Query, Auth, Toasts, etc.
 *
 * Contiene:
 * - QueryClient: Cache de datos, loading states (React Query)
 * - AuthProvider: Estado de autenticación y usuario
 * - Toaster: Sistema de notificaciones globales
 * - [Futuro] ThemeProvider, ConfirmProvider, etc.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
// import { ConfirmProvider } from '@/context/confirm-context';
import { SidebarProvider } from '@/context/sidebar-context';
// import { PrecioSyncProvider } from '@/context/precio-sync-context';
import { QUERY_CONFIG } from '@/lib/constants';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: QUERY_CONFIG,
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* <ConfirmProvider> */}
          <AuthProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </AuthProvider>
        {/* </ConfirmProvider> */}
      </ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            border: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
