import { useQuery } from '@tanstack/react-query';
import { executeQuery } from '@/services/graphql-client';
import { LIST_UNIDADES_QUERY } from '@/graphql/queries/unidades.queries';
import { getSimpleAutoSyncService } from '@/services/simple-auto-sync.service';
import { getUnidadesFromIndexedDB } from '@/lib/db';

/**
 * Hook para listar unidades con soporte offline
 * Patrón híbrido: IndexedDB primero, luego GraphQL si es necesario
 */
export function useUnidadesOffline() {
  return useQuery({
    queryKey: ['unidades-offline'],
    queryFn: async () => {
      // Verificar sincronización automática
      const syncService = getSimpleAutoSyncService();
      await syncService.checkAndSyncIfNeeded();

      // Intentar obtener de IndexedDB primero
      const unidadesOffline = await getUnidadesFromIndexedDB();

      if (unidadesOffline.length > 0) {
        console.log(`[useUnidadesOffline] 📱 Usando ${unidadesOffline.length} unidades desde IndexedDB`);
        return unidadesOffline;
      }

      // Si no hay datos en IndexedDB, hacer consulta GraphQL
      console.log('[useUnidadesOffline] 🔄 Consultando unidades desde servidor...');
      const response = await executeQuery<{
        listUnidad: Array<{
          id: string;
          unidad_id: string;
          nombre: string;
          descripcion: string;
        }>;
      }>(LIST_UNIDADES_QUERY);

      return response.listUnidad;
    },
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook para obtener opciones iniciales para SelectSearch (patrón híbrido)
 */
export function useUnidadesOfflineOptions() {
  const { data, isLoading, error } = useUnidadesOffline();

  const options = data?.map((unidad) => ({
    value: unidad.id,
    label: unidad.nombre,
  })) || [];

  return {
    options,
    isLoading,
    error,
    hasMore: false, // Unidades no tienen paginación compleja
    total: data?.length || 0,
  };
}