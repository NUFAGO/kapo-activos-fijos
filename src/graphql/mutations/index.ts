

// Exportar mutations de activos fijos
export {
  CREATE_ACTIVO_FIJO_MUTATION,
  UPDATE_ACTIVO_FIJO_MUTATION,
  DELETE_ACTIVO_FIJO_MUTATION,
  GET_ESTADISTICAS_ACTIVOS_FIJOS_QUERY,
  // GET_ACTIVO_FIJO_QUERY movido a queries/activos-fijos.queries.ts
} from './activos-fijos.mutations';

// Exportar mutations de reportes de activos fijos
export {
  CREATE_REPORTE_ACTIVO_FIJO_MUTATION,
  UPDATE_REPORTE_ACTIVO_FIJO_MUTATION,
  DELETE_REPORTE_ACTIVO_FIJO_MUTATION,
} from './activos-fijos.mutations';