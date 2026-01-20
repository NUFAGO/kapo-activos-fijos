import { useQuery } from '@tanstack/react-query';
import { executeQuery } from '@/services/graphql-client';
import { LIST_OBRAS_QUERY } from '@/graphql/queries/obras.queries';

/**
 * Hook para obtener todas las obras
 */
export function useObras() {
  return useQuery({
    queryKey: ['obras'],
    queryFn: async () => {
      const response = await executeQuery<{
        listObras: Array<{
          _id: string;
          nombre: string;
          titulo?: string;
          id_proyecto?: string;
          empresa_id?: string;
        }>;
      }>(LIST_OBRAS_QUERY);

      return response.listObras;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
