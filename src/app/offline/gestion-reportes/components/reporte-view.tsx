import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, User, Calendar, Package, AlertTriangle, CheckCircle, XCircle, Eye, Download, X, ChevronDown, ChevronUp, FileImage } from 'lucide-react';

// Tipos para los datos offline
interface RecursoOffline {
  id_recurso: string;
  codigo_recurso: string;
  nombre_recurso: string;
  marca?: string;
  estado: 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado';
  descripcion?: string;
  evidencia_urls?: string[];
  evidence_files?: Blob[]; // Imágenes como Blobs
}

interface ReporteOffline {
  id: string;
  titulo: string;
  recursos: RecursoOffline[];
  usuario_nombres?: string;
  fecha_creacion: number;
  fecha_sincronizacion?: number;
  sync_status: 'pending' | 'synced' | 'error';
  sync_error?: string;
}

interface ReporteOfflineViewProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: ReporteOffline | null;
  /** Si se provee y el reporte es pendiente, se muestra "Ir a cambiar esto" para abrir el modal de edición */
  onIrACambiar?: () => void;
}

const reporteHasRecursosOffline = (r: ReporteOffline | null) =>
  r?.recursos?.some((x) => x.codigo_recurso?.startsWith?.('TEMP-')) ?? false;

const MENSAJE_RECURSOS_OFFLINE =
  'Este informe tiene recursos creados offline. Puedes cambiar a recursos ya existentes o sincronizar para que se creen en el catálogo de recursos.';

// Función para formatear fecha
const formatDate = (timestamp: number) => {
  if (!timestamp) return '-';
  try {
    return new Date(timestamp).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
};

// Componente para el badge de estado del recurso
const getEstadoBadge = (estado: string) => {
  const badges = {
    'Operativo': {
      icon: CheckCircle,
      className: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
    },
    'Observado': {
      icon: AlertTriangle,
      className: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
    },
    'Inoperativo': {
      icon: XCircle,
      className: 'bg-[var(--destructive)]/10 text-[var(--destructive)] dark:bg-[var(--destructive)]/20 dark:text-red-400'
    },
    'No encontrado': {
      icon: Package,
      className: 'bg-[var(--muted)] text-[var(--muted-foreground)]'
    }
  };

  const badge = badges[estado as keyof typeof badges] || {
    icon: Package,
    className: 'bg-[var(--muted)] text-[var(--muted-foreground)]'
  };

  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${badge.className}`}>
      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      <span className="hidden sm:inline">{estado}</span>
      <span className="sm:hidden">
        {estado === 'Operativo' && 'OK'}
        {estado === 'Observado' && 'Obs'}
        {estado === 'Inoperativo' && 'Inop'}
        {estado === 'No encontrado' && 'NE'}
      </span>
    </span>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-md">
      <div className="w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-[var(--card-bg)] rounded-xl sm:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/10 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

// ImageViewer Component - Adaptado para Blobs offline
const ImageViewer = ({ blob, alt, index }: { blob: Blob; alt: string; index: number }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string>('');

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [blob]);

  if (!objectUrl) {
    return (
      <div className="aspect-square bg-[var(--surface)] rounded-lg border border-[var(--border)] flex items-center justify-center">
        <FileImage className="h-6 w-6 text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <>
      <div
        className="relative group aspect-square cursor-pointer overflow-hidden rounded-lg border border-[var(--border)]/50 hover:border-[var(--primary)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(var(--primary),0.2)] transition-all duration-300 hover:-translate-y-0.5"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={objectUrl}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-2 right-2 flex gap-1">
            <div className="p-1.5 bg-[var(--background)]/90 rounded-full">
              <Eye className="h-3.5 w-3.5 text-[var(--text-primary)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal - Renderizado fuera del componente con Portal */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-10 sm:-top-12 right-0 p-2 bg-[var(--background)]/10 hover:bg-[var(--background)]/20 rounded-full transition-all duration-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-primary)]" />
            </button>
            <img
              src={objectUrl}
              alt={alt}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <a
              href={objectUrl}
              download={alt}
              className="absolute -bottom-10 sm:-bottom-12 right-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[var(--background)]/10 hover:bg-[var(--background)]/20 text-[var(--text-primary)] rounded-full transition-all duration-200 text-xs sm:text-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Descargar</span>
              <span className="sm:hidden">↓</span>
            </a>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// RecursoCard Component
const RecursoCard = ({ recurso, index }: { recurso: RecursoOffline; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-[var(--card-bg)]/95 rounded-lg sm:rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden card-shadow hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.1)] hover:-translate-y-0.25 transition-all duration-300">
      {/* Header del Recurso */}
      <div
        className="p-3 sm:p-4 cursor-pointer hover:bg-[var(--hover-bg)] transition-all duration-200 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs sm:text-sm font-semibold shadow-[0_1px_3px_0_rgba(var(--primary),0.2)] ">
                {index + 1}
              </div>
              <h4 className="text-sm sm:text-md font-semibold text-[var(--text-on-content-bg-heading)] truncate">
                {recurso.nombre_recurso}
              </h4>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs text-[var(--text-secondary)]">
              <span className="font-mono text-xs">{recurso.codigo_recurso}</span>
              {recurso.marca && recurso.marca !== 'Marca Desconocida' && (
                <>
                  <span className="text-[var(--muted-foreground)]">•</span>
                  <span className="truncate">{recurso.marca}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {getEstadoBadge(recurso.estado)}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]" />
            )}
          </div>
        </div>
      </div>

      {/* Content del Recurso */}
      {isExpanded && (
        <div className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
          {/* Descripción */}
          {recurso.descripcion && (
            <div className="bg-[var(--card-bg)] rounded-lg p-1 sm:p-1 border border-[var(--border-color)]/50 shadow-[0_1px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-xs sm:text-xs text-[var(--text-on-content-bg)] leading-relaxed">
                {recurso.descripcion}
              </p>
            </div>
          )}

          {/* Evidencias */}
          {recurso.evidence_files && recurso.evidence_files.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-xs font-medium text-[var(--text-on-content-bg-heading)]">
                  Evidencias ({recurso.evidence_files.length})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {recurso.evidence_files.map((blob, evidenciaIndex) => (
                  <ImageViewer
                    key={evidenciaIndex}
                    blob={blob}
                    alt={`Evidencia ${recurso.codigo_recurso} - ${evidenciaIndex + 1}`}
                    index={evidenciaIndex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function ReporteOfflineView({ isOpen, onClose, reporte, onIrACambiar }: ReporteOfflineViewProps) {
  if (!reporte) return null;

  // Calcular estadísticas
  const totalRecursos = reporte.recursos?.length || 0;
  const estadisticas = reporte.recursos?.reduce((acc, recurso) => {
    acc[recurso.estado] = (acc[recurso.estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--header-bg)]/95 backdrop-blur-md border-b border-[var(--border-color)]/50 px-3 sm:px-6 py-3 sm:py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--primary)]/10 shadow-[0_2px_8px_-2px_rgba(var(--primary),0.15)] ">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-sm font-semibold text-[var(--text-on-content-bg-heading)] truncate">
                  {reporte.titulo}
                </h2>
                <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-3">
                  <p className="text-xs sm:text-xs text-[var(--text-secondary)]">
                    Creado: {formatDate(reporte.fecha_creacion)}
                  </p>
                  {reporte.sync_status === 'synced' && reporte.fecha_sincronizacion && (
                    <p className="text-xs sm:text-xs text-[var(--text-secondary)]">
                      Sync: {formatDate(reporte.fecha_sincronizacion)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Información adicional offline */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg bg-[var(--card-bg)] text-[var(--text-on-content-bg)] text-xs font-medium card-shadow">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="truncate max-w-40 sm:max-w-none">{reporte.usuario_nombres || 'Usuario'}</span>
              </div>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg bg-[var(--card-bg)] text-[var(--text-on-content-bg)] text-xs font-medium card-shadow">
                <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{totalRecursos} recurso{totalRecursos !== 1 ? 's' : ''}</span>
                <span className="sm:hidden">{totalRecursos}</span>
              </div>
              {estadisticas && Object.entries(estadisticas).map(([estado, count]) => (
                <div key={estado} className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg bg-[var(--card-bg)] text-xs font-medium card-shadow">
                  {estado === 'Operativo' && <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />}
                  {estado === 'Observado' && <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600" />}
                  {estado === 'Inoperativo' && <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--destructive)]" />}
                  {estado === 'No encontrado' && <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--muted-foreground)]" />}
                  <span className="text-[var(--text-on-content-bg)] ml-0.5 sm:ml-1">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-[var(--hover-bg)] transition-all duration-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Aviso recursos offline */}
      {reporteHasRecursosOffline(reporte) && (
        <div className="mx-3 sm:mx-6 mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 ">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {MENSAJE_RECURSOS_OFFLINE}
            {onIrACambiar && reporte.sync_status === 'pending' && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={onIrACambiar}
                  className="underline hover:no-underline font-medium focus:outline-none focus:ring-1 focus:ring-amber-500/50 rounded"
                >
                  Clic aquí para editar
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
        {reporte.recursos && reporte.recursos.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {reporte.recursos.map((recurso, index) => (
              <RecursoCard key={recurso.id_recurso} recurso={recurso} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-3 sm:mb-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] border border-white/5">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-sm sm:text-xs font-medium text-[var(--text-on-content-bg-heading)] mb-1">
              Sin recursos evaluados
            </h3>
            <p className="text-xs sm:text-xs text-[var(--text-secondary)]">
              No hay recursos registrados en este reporte offline
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[var(--border-color)]/50 px-3 sm:px-6 py-3 sm:py-4 shadow-[0_-1px_3px_0_rgba(0,0,0,0.1),0_-1px_2px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="text-xs text-[var(--text-secondary)] hidden sm:block">
            Reporte offline • {
              reporte.sync_status === 'pending' ? 'Pendiente de sincronización' :
              reporte.sync_status === 'error' ? 'Error en sincronización' :
              'Sincronizado'
            }
          </div>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-lg bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--muted-foreground)] text-xs sm:text-xs font-medium transition-all duration-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
