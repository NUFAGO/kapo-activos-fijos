import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeQuery, executeMutation, executeMutationWithFiles } from '@/services/graphql-client';
import {
  LIST_REPORTES_ACTIVOS_FIJOS_QUERY,
  GET_REPORTE_ACTIVO_FIJO_QUERY,
  GET_REPORTE_ACTIVO_FIJO_POR_ID_QUERY,
  GET_REPORTES_BY_USUARIO_QUERY,
  GET_REPORTES_BY_RECURSO_QUERY,
  GET_HISTORIAL_RECURSO_QUERY,
  GET_ESTADISTICAS_REPORTES_QUERY,
  LIST_REPORTES_PAGINADOS_QUERY,
} from '@/graphql/queries';
import {
  CREATE_REPORTE_ACTIVO_FIJO_MUTATION,
  UPDATE_REPORTE_ACTIVO_FIJO_MUTATION,
  DELETE_REPORTE_ACTIVO_FIJO_MUTATION,
} from '@/graphql/mutations';
import {
  ReporteActivoFijo,
  CrearReporteActivoFijoInput,
  ActualizarReporteActivoFijoInput,
  EstadisticasReportes,
  HistorialRecurso,
  ReportesPaginationInput,
  ReportesPaginationResult,
} from '@/types/activos-fijos.types';
import { useAuth } from '@/hooks';
import toast from 'react-hot-toast';

/**
 * 📋 HOOKS PARA REPORTES DE ACTIVOS FIJOS
 */

/**
 * Hook para listar todos los reportes de activos fijos
 */
export function useReportesActivosFijos() {
  return useQuery<ReporteActivoFijo[]>({
    queryKey: ['reportes-activos-fijos'],
    queryFn: async () => {
      const response = await executeQuery<{ listReportesActivosFijos: ReporteActivoFijo[] }>(
        LIST_REPORTES_ACTIVOS_FIJOS_QUERY
      );
      return response.listReportesActivosFijos;
    },
    staleTime: 30000, // 30 segundos
  });
}

/**
 * Hook para obtener un reporte por ID
 */
export function useReporteActivoFijo(id: string | null) {
  return useQuery<ReporteActivoFijo | null>({
    queryKey: ['reporte-activo-fijo', id],
    queryFn: async () => {
      if (!id) return null;

      try {
        const response = await executeQuery<{ getReporteActivoFijo: ReporteActivoFijo | null }>(
          GET_REPORTE_ACTIVO_FIJO_QUERY,
          { id }
        );
        return response.getReporteActivoFijo;
      } catch (error) {
        console.error('Error obteniendo reporte:', error);
        return null;
      }
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener un reporte por ID de reporte
 */
export function useReporteActivoFijoPorId(idReporte: string | null) {
  return useQuery<ReporteActivoFijo | null>({
    queryKey: ['reporte-activo-fijo-id', idReporte],
    queryFn: async () => {
      if (!idReporte) return null;

      try {
        const response = await executeQuery<{ getReporteActivoFijoPorId: ReporteActivoFijo | null }>(
          GET_REPORTE_ACTIVO_FIJO_POR_ID_QUERY,
          { id_reporte: idReporte }
        );
        return response.getReporteActivoFijoPorId;
      } catch (error) {
        console.error('Error obteniendo reporte por ID:', error);
        return null;
      }
    },
    enabled: !!idReporte,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener reportes por usuario
 */
export function useReportesByUsuario(idUsuario: string | null) {
  return useQuery<ReporteActivoFijo[]>({
    queryKey: ['reportes-by-usuario', idUsuario],
    queryFn: async () => {
      if (!idUsuario) return [];

      const response = await executeQuery<{ getReportesActivosFijosByUsuario: ReporteActivoFijo[] }>(
        GET_REPORTES_BY_USUARIO_QUERY,
        { id_usuario: idUsuario }
      );
      return response.getReportesActivosFijosByUsuario;
    },
    enabled: !!idUsuario,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener reportes por recurso
 */
export function useReportesByRecurso(idRecurso: string | null) {
  return useQuery<ReporteActivoFijo[]>({
    queryKey: ['reportes-by-recurso', idRecurso],
    queryFn: async () => {
      if (!idRecurso) return [];

      const response = await executeQuery<{ getReportesActivosFijosByRecurso: ReporteActivoFijo[] }>(
        GET_REPORTES_BY_RECURSO_QUERY,
        { id_recurso: idRecurso }
      );
      return response.getReportesActivosFijosByRecurso;
    },
    enabled: !!idRecurso,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener historial de un recurso
 */
export function useHistorialRecurso(idRecurso: string | null) {
  return useQuery<HistorialRecurso | null>({
    queryKey: ['historial-recurso', idRecurso],
    queryFn: async () => {
      if (!idRecurso) return null;

      try {
        const response = await executeQuery<{ getHistorialRecurso: HistorialRecurso }>(
          GET_HISTORIAL_RECURSO_QUERY,
          { id_recurso: idRecurso }
        );
        return response.getHistorialRecurso;
      } catch (error) {
        console.error('Error obteniendo historial:', error);
        return null;
      }
    },
    enabled: !!idRecurso,
    staleTime: 60000, // 1 minuto
  });
}

/**
 * Hook para obtener estadísticas de reportes
 */
export function useEstadisticasReportes() {
  return useQuery<EstadisticasReportes>({
    queryKey: ['estadisticas-reportes'],
    queryFn: async () => {
      const response = await executeQuery<{ estadisticasReportes: EstadisticasReportes }>(
        GET_ESTADISTICAS_REPORTES_QUERY
      );
      return response.estadisticasReportes;
    },
    staleTime: 300000, // 5 minutos
  });
}

/**
 * Hook para listar reportes con paginación
 */
export function useReportesPaginados(input?: ReportesPaginationInput) {
  return useQuery<ReportesPaginationResult>({
    queryKey: ['reportes-paginados', input],
    queryFn: async () => {
      const variables = {
        input: {
          page: input?.page || 1,
          limit: input?.limit || 10,
          filters: input?.filters,
          search: input?.search,
          sortBy: input?.sortBy,
          sortOrder: input?.sortOrder,
        }
      };

      const response = await executeQuery<{ listReportesActivosFijosPaginated: ReportesPaginationResult }>(
        LIST_REPORTES_PAGINADOS_QUERY,
        variables
      );
      return response.listReportesActivosFijosPaginated;
    },
    staleTime: 30000,
  });
}

/**
 * Hook para crear un reporte de activo fijo
 */
export function useCreateReporteActivoFijo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<ReporteActivoFijo, Error, CrearReporteActivoFijoInput>({
    mutationFn: async (input) => {
      // Asegurar que el usuario esté autenticado
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const variables = {
        titulo: input.titulo,
        usuario_id: user.id,
        usuario_nombre: user.nombresA || 'Usuario',
        recursos: input.recursos,
        notas_generales: input.notas_generales,
      };

      // Siempre usar Apollo Client ya que ahora los archivos van por recurso
      const hasFiles = input.recursos.some(r => r.evidence_files && r.evidence_files.length > 0);
      const response = hasFiles
        ? await executeMutationWithFiles<{ addReporteActivoFijo: ReporteActivoFijo }>(
            CREATE_REPORTE_ACTIVO_FIJO_MUTATION,
            variables
          )
        : await executeMutation<{ addReporteActivoFijo: ReporteActivoFijo }>(
            CREATE_REPORTE_ACTIVO_FIJO_MUTATION,
            variables
          );

      return response.addReporteActivoFijo;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['reportes-activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-by-usuario', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-reportes'] });
      // Invalidar TODAS las queries de activos fijos (incluyendo todas las páginas y filtros)
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'], exact: false });

      // Solo mostrar toast si NO es sincronización offline
      if (!variables?.esSincronizacionOffline) {
        toast.success(`Reporte ${data.id_reporte} creado exitosamente`);
      }
    },
    onError: (error) => {
      console.error('Error creando reporte:', error);
      toast.error(`Error al crear reporte: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar un reporte de activo fijo
 */
export function useUpdateReporteActivoFijo() {
  const queryClient = useQueryClient();

  return useMutation<ReporteActivoFijo, Error, ActualizarReporteActivoFijoInput & { id: string }>({
    mutationFn: async ({ id, ...input }) => {
      const variables = {
        id,
        titulo: input.titulo,
        recursos: input.recursos,
        notas_generales: input.notas_generales,
      };

      // Siempre usar Apollo Client ya que ahora los archivos van por recurso
      const hasFiles = input.recursos?.some(r => r.evidence_files && r.evidence_files.length > 0);
      const response = hasFiles
        ? await executeMutationWithFiles<{ updateReporteActivoFijo: ReporteActivoFijo }>(
            UPDATE_REPORTE_ACTIVO_FIJO_MUTATION,
            variables
          )
        : await executeMutation<{ updateReporteActivoFijo: ReporteActivoFijo }>(
            UPDATE_REPORTE_ACTIVO_FIJO_MUTATION,
            variables
          );

      return response.updateReporteActivoFijo;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['reportes-activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['reporte-activo-fijo', data._id] });
      queryClient.invalidateQueries({ queryKey: ['reporte-activo-fijo-id', data.id_reporte] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-reportes'] });

      toast.success(`Reporte ${data.id_reporte} actualizado exitosamente`);
    },
    onError: (error) => {
      console.error('Error actualizando reporte:', error);
      toast.error(`Error al actualizar reporte: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar un reporte de activo fijo
 */
export function useDeleteReporteActivoFijo() {
  const queryClient = useQueryClient();

  return useMutation<ReporteActivoFijo, Error, string>({
    mutationFn: async (id) => {
      const response = await executeMutation<{ deleteReporteActivoFijo: ReporteActivoFijo }>(
        DELETE_REPORTE_ACTIVO_FIJO_MUTATION,
        { id }
      );

      return response.deleteReporteActivoFijo;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['reportes-activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-reportes'] });

      toast.success(`Reporte ${data.id_reporte} eliminado exitosamente`);
    },
    onError: (error) => {
      console.error('Error eliminando reporte:', error);
      toast.error(`Error al eliminar reporte: ${error.message}`);
    },
  });
}
