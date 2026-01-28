import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { executeQuery } from '@/services/graphql-client';
import { LIST_CLASIFICACIONES_RECURSO_QUERY } from '@/graphql/queries/clasificaciones.queries';
import { getSimpleAutoSyncService } from '@/services/simple-auto-sync.service';
import { getClasificacionesFromIndexedDB } from '@/lib/db';

/**
 * Hook para listar clasificaciones con soporte offline
 * Patrón híbrido: IndexedDB primero, luego GraphQL si es necesario
 */
export function useClasificacionesOffline() {
  return useQuery({
    queryKey: ['clasificaciones-offline'],
    queryFn: async () => {
      // Verificar sincronización automática
      const syncService = getSimpleAutoSyncService();
      await syncService.checkAndSyncIfNeeded();

      // Intentar obtener de IndexedDB primero
      const clasificacionesOffline = await getClasificacionesFromIndexedDB();

      if (clasificacionesOffline.length > 0) {
        console.log(`[useClasificacionesOffline] 📱 Usando ${clasificacionesOffline.length} clasificaciones desde IndexedDB`);
        return clasificacionesOffline;
      }

      // Si no hay datos en IndexedDB, hacer consulta GraphQL
      console.log('[useClasificacionesOffline] 🔄 Consultando clasificaciones desde servidor...');
      const response = await executeQuery<{
        listClasificacionRecurso: Array<{
          id: string;
          nombre: string;
          parent_id: string | null;
          childs?: Array<{
            id: string;
            nombre: string;
            parent_id: string | null;
          }>;
        }>;
      }>(LIST_CLASIFICACIONES_RECURSO_QUERY);

      return response.listClasificacionRecurso;
    },
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook para obtener opciones jerárquicas para Select (clasificaciones con hijos)
 */
export function useClasificacionesOfflineJerarquicas() {
  const { data, isLoading, error } = useClasificacionesOffline();

  // Convertir clasificaciones a opciones de select (jerárquicas como en KAPO)
  const opcionesClasificaciones = React.useMemo(() => {
    const options: Array<{ value: string; label: string; disabled?: boolean; style?: any }> = [{ value: '', label: 'Seleccionar clasificación' }];


    const buildOptions = (clases: typeof data, level = 0): void => {
      if (!clases) return;

      clases.forEach((clasificacion) => {
        const hasChildren = clasificacion.childs && clasificacion.childs.length > 0;

        // TODAS las clasificaciones son seleccionables (no disabled)
        options.push({
          value: clasificacion.id,
          label: level === 0 ? clasificacion.nombre : `├─ ${clasificacion.nombre}`,
          disabled: false, // Cambiado: todas son seleccionables
          style: hasChildren ? {
            color: level === 0 ? '#2563EB' : '#059669', // Azul y verde para categorías con hijos
            fontWeight: 'bold',
            paddingLeft: level > 0 ? '16px' : undefined,
          } : {
            paddingLeft: level > 0 ? '16px' : undefined, // Sin color especial para hojas
          },
        });

        if (hasChildren) {
          buildOptions(clasificacion.childs, level + 1);
        }
      });
    };

    buildOptions(data);
    return options;
  }, [data]);

  return {
    options: opcionesClasificaciones,
    isLoading,
    error,
    total: data?.length || 0,
  };
}