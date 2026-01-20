import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeQuery, executeMutation } from '@/services/graphql-client';
import { LIST_ACTIVOS_FIJOS_PAGINADOS_QUERY, GET_ACTIVO_FIJO_QUERY } from '@/graphql/queries/activos-fijos.queries';
import {
  CREATE_ACTIVO_FIJO_MUTATION,
  UPDATE_ACTIVO_FIJO_MUTATION,
  DELETE_ACTIVO_FIJO_MUTATION,
  GET_ESTADISTICAS_ACTIVOS_FIJOS_QUERY,
} from '@/graphql/mutations/activos-fijos.mutations';
import { ActivosFijosPaginationInput, ActivosFijosPaginationResult, ActivoFijo, EstadisticasActivosFijos } from '@/types/activos-fijos.types';
import { useAuth } from '@/hooks';
import toast from 'react-hot-toast';

/**
 * Hook para listar activos fijos con paginación
 */
export function useActivosFijos(input?: ActivosFijosPaginationInput) {
  return useQuery<ActivosFijosPaginationResult>({
    queryKey: ['activos-fijos', input],
    queryFn: async () => {
      const variables = {
        page: input?.page || 1,
        itemsPage: input?.itemsPage || 20,
        searchTerm: input?.searchTerm,
        filterRangeDate: input?.filterRangeDate,
        filter: input?.filter
      };

      const response = await executeQuery<{ listActivosFijosPaginados: ActivosFijosPaginationResult }>(
        LIST_ACTIVOS_FIJOS_PAGINADOS_QUERY,
        variables
      );
      return response.listActivosFijosPaginados;
    },
    staleTime: 30000, // 30 segundos
  });
}

/**
 * Hook para obtener un activo fijo por ID
 * TODO: Implementar cuando se desarrolle el backend correspondiente
 */
export function useActivoFijo(id: string | null) {
  return useQuery<ActivoFijo | null>({
    queryKey: ['activo-fijo', id],
    queryFn: async () => {
      if (!id) return null;

      try {
        const response = await executeQuery<{ getActivoFijo: ActivoFijo | null }>(
          GET_ACTIVO_FIJO_QUERY,
          { id }
        );
        return response.getActivoFijo;
      } catch (error) {
        console.error('Error obteniendo activo fijo:', error);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook para crear un activo fijo
 * TODO: Implementar cuando se desarrolle el backend correspondiente
 */
export function useCreateActivoFijo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Partial<ActivoFijo>) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      try {
        const response = await executeMutation<{ createActivoFijo: ActivoFijo }>(
          CREATE_ACTIVO_FIJO_MUTATION,
          { input, usuario_id: user.id }
        );
        return response.createActivoFijo;
      } catch (error) {
        console.error('Error creando activo fijo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-activos-fijos'] });
      toast.success('Activo fijo creado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error en useCreateActivoFijo:', error);
      toast.error(error?.message || 'Error al crear el activo fijo');
    },
  });
}

/**
 * Hook para actualizar un activo fijo
 * TODO: Implementar cuando se desarrolle el backend correspondiente
 */
export function useUpdateActivoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string } & Partial<ActivoFijo>) => {
      try {
        const response = await executeMutation<{ updateActivoFijo: ActivoFijo }>(
          UPDATE_ACTIVO_FIJO_MUTATION,
          input
        );
        return response.updateActivoFijo;
      } catch (error) {
        console.error('Error actualizando activo fijo:', error);
        throw error;
      }
    },
    onSuccess: (activoFijo) => {
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['activo-fijo', activoFijo.id_recurso] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-activos-fijos'] });
      toast.success('Activo fijo actualizado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error en useUpdateActivoFijo:', error);
      toast.error(error?.message || 'Error al actualizar el activo fijo');
    },
  });
}

/**
 * Hook para eliminar un activo fijo
 * TODO: Implementar cuando se desarrolle el backend correspondiente
 */
export function useDeleteActivoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await executeMutation<{ deleteActivoFijo: ActivoFijo }>(
          DELETE_ACTIVO_FIJO_MUTATION,
          { id }
        );
        return response.deleteActivoFijo;
      } catch (error) {
        console.error('Error eliminando activo fijo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-activos-fijos'] });
      toast.success('Activo fijo eliminado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error en useDeleteActivoFijo:', error);
      toast.error(error?.message || 'Error al eliminar el activo fijo');
    },
  });
}


/**
 * Hook para obtener estadísticas de activos fijos
 * TODO: Implementar cuando se desarrolle el backend correspondiente
 */
export function useEstadisticasActivosFijos() {
  return useQuery<EstadisticasActivosFijos>({
    queryKey: ['estadisticas-activos-fijos'],
    queryFn: async () => {
      try {
        const response = await executeQuery<{ getEstadisticasActivosFijos: EstadisticasActivosFijos }>(
          GET_ESTADISTICAS_ACTIVOS_FIJOS_QUERY
        );
        return response.getEstadisticasActivosFijos;
      } catch (error) {
        console.error('Error obteniendo estadísticas de activos fijos:', error);
        // Retornar datos por defecto si falla la query
        return {
          total_activos: 0,
          activos_vigentes: 0,
          activos_usados: 0,
          total_valor: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
