import { useQuery } from '@tanstack/react-query';
import { executeQuery } from '@/services/graphql-client';
import { LIST_CLASIFICACIONES_RECURSO_QUERY } from '@/graphql/queries/clasificaciones.queries';

/**
 * Hook para obtener todas las clasificaciones de recurso
 */
export function useClasificaciones() {
  return useQuery({
    queryKey: ['clasificaciones'],
    queryFn: async () => {
      const response = await executeQuery<{
        listClasificacionRecurso: Array<{
          id: string;
          nombre: string;
          parent_id: string | null;
          childs?: Array<{
            id: string;
            nombre: string;
            parent_id: string | null;
            childs?: Array<{
              id: string;
              nombre: string;
              parent_id: string | null;
            }>;
          }>;
        }>;
      }>(LIST_CLASIFICACIONES_RECURSO_QUERY);

      return response.listClasificacionRecurso;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}