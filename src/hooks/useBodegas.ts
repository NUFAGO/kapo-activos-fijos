import { useQuery } from '@tanstack/react-query';
import { executeQuery } from '@/services/graphql-client';
import { LIST_BODEGAS_QUERY } from '@/graphql/queries/bodegas.queries';

/**
 * Hook para obtener todas las bodegas
 */
export function useBodegas() {
  return useQuery({
    queryKey: ['bodegas'],
    queryFn: async () => {
      const response = await executeQuery<{
        listBodegas: Array<{
          _id: string;
          codigo: string;
          nombre: string;
          obra_id: string;
        }>;
      }>(LIST_BODEGAS_QUERY);

      return response.listBodegas;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
