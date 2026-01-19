/**
 * ⚙️ SERVICES - SERVICIOS DE NEGOCIO
 *
 * Responsabilidad: Lógica de negocio específica del frontend
 * Flujo: Importado por hooks → Procesamiento de datos antes de GraphQL
 *
 * Contendrá:
 * - activoService: Lógica específica de activos
 * - categoriaService: Lógica específica de categorías
 * - [Futuro] Más servicios específicos del negocio
 */

// Servicios existentes
export { authService } from './auth-service';

// Servicio de sincronización PWA
export {
  SyncService,
  getSyncService,
  useSyncService,
} from './sync.service';

// Servicio de activos fijos eliminado - ahora usamos hooks directos siguiendo patrón kapo-presupuestos

// [Futuro] Servicios de negocio
// export { activoService } from './activo.service';
// export { categoriaService } from './categoria.service';
