import { useQuery } from '@tanstack/react-query';
import { executeQuery } from '@/services/graphql-client';
import { LIST_UNIDADES_QUERY } from '@/graphql/queries/unidades.queries';

/**
 * Hook para obtener todas las unidades
 */
export function useUnidades() {
  return useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
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
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}