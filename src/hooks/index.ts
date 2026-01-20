

// Hooks de autenticación (viene del context)
export { useAuth } from '@/context/auth-context';

// Hooks PWA y conectividad
export {
  useOnline,
  useIsOnline,
  useRequireOnline,
} from './use-online';

export {
  useServiceWorkerUpdate,
  useUpdateNotification,
  useUpdateProgress,
} from './use-sw-update';

// Hooks de activos fijos
export { useActivosFijos, useActivoFijo } from './useActivosFijos';

// Hooks de obras y bodegas
export { useObras } from './useObras';
export { useBodegas } from './useBodegas';

// Hooks de recursos activos fijos
export { useRecursosActivosFijos, useRecursosActivosFijosOptions } from './useRecursosActivosFijos';

// Hooks de reportes de activos fijos
export {
  useReportesActivosFijos,
  useReporteActivoFijo,
  useReporteActivoFijoPorId,
  useReportesByUsuario,
  useReportesByRecurso,
  useHistorialRecurso,
  useEstadisticasReportes,
  useReportesPaginados,
  useCreateReporteActivoFijo,
  useUpdateReporteActivoFijo,
  useDeleteReporteActivoFijo,
} from './useReportesActivosFijos';

// Hook de estado de página (filtros reutilizables)
export { usePageState } from './usePageState';

// [Futuro] Exportar hooks de negocio aquí
// export { useActivos } from './useActivos';
// export { useCategorias } from './useCategorias';
