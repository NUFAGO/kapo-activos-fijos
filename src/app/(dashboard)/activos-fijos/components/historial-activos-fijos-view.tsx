'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Eye, Download, AlertTriangle, CheckCircle, XCircle, Package, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { useReportesByRecurso } from '@/hooks';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ReporteActivoFijo } from '@/types/activos-fijos.types';

interface HistorialActivosFijosViewProps {
  isOpen: boolean;
  onClose: () => void;
  recursoId: string | null;
}

// Función para formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Función para obtener el badge de estado del recurso en el reporte
const getEstadoBadge = (estado: string) => {
  const badges = {
    'Operativo': { icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    'Observado': { icon: AlertTriangle, className: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
    'Inoperativo': { icon: XCircle, className: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
    'No encontrado': { icon: Package, className: 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' }
  };

  const badge = badges[estado as keyof typeof badges] || { icon: Package, className: 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' };
  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
      <Icon className="h-3 w-3" />
      {estado}
    </span>
  );
};

// ImageViewer Component
const ImageViewer = ({ url, alt, index }: { url: string; alt: string; index: number }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="aspect-square bg-[var(--surface)] rounded-lg border border-[var(--border)] flex items-center justify-center">
        <Eye className="h-6 w-6 text-[var(--text-secondary)]" />
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
          src={url}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => setHasError(true)}
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
          <div className="relative w-full max-w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-8 sm:-top-10 md:-top-12 right-2 sm:right-0 p-1.5 sm:p-2 bg-[var(--background)]/10 hover:bg-[var(--background)]/20 rounded-full transition-all duration-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-[var(--text-primary)]" />
            </button>
            <img
              src={url}
              alt={alt}
              className="w-full h-auto max-h-[80vh] sm:max-h-[85vh] object-contain rounded-lg"
            />
            <a
              href={url}
              download={alt}
              className="absolute -bottom-8 sm:-bottom-10 md:-bottom-12 right-2 sm:right-0 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-[var(--background)]/10 hover:bg-[var(--background)]/20 text-[var(--text-primary)] rounded-full transition-all duration-200 text-xs sm:text-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]"
            >
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline sm:hidden md:inline">Descargar</span>
              <span className="xs:hidden sm:inline md:hidden">↓</span>
            </a>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Componente para mostrar información de un reporte
const ReporteItem = ({ reporte, recursoId }: { reporte: ReporteActivoFijo; recursoId: string }) => {
  const [showPhotos, setShowPhotos] = useState(false);

  // Encontrar el recurso específico en este reporte
  const recursoEspecifico = reporte.recursos?.find(r => r.id_recurso === recursoId);

  if (!recursoEspecifico) return null;

  return (
    <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow">
      {/* Información principal - Clickable en todas las pantallas para expandir/colapsar */}
      <div
        className={`flex flex-col gap-3 ${recursoEspecifico.evidencia_urls && recursoEspecifico.evidencia_urls.length > 0 ? 'cursor-pointer' : ''}`}
        onClick={() => {
          // En todas las pantallas, si hay evidencias, hacer click en toda el área
          if (recursoEspecifico.evidencia_urls && recursoEspecifico.evidencia_urls.length > 0) {
            setShowPhotos(!showPhotos);
          }
        }}
      >
        {/* Header con ID, fecha y indicador visual */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-mono font-medium text-[var(--text-primary)] break-all xs:break-normal truncate">
              {reporte.id_reporte}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] flex-shrink-0">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{formatDate(reporte.fecha_creacion)}</span>
            </div>
          </div>
          {/* Indicador visual - en todas las pantallas */}
          {recursoEspecifico.evidencia_urls && recursoEspecifico.evidencia_urls.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Package className="h-3 w-3" />
              <span>{recursoEspecifico.evidencia_urls.length}</span>
              {showPhotos ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          )}
        </div>

        {/* Badge de estado */}
        <div className="flex items-center justify-start xs:justify-end">
          {getEstadoBadge(recursoEspecifico.estado || 'No encontrado')}
        </div>
      </div>

      {/* Fotos (solo si hay y está expandido) */}
      {showPhotos && recursoEspecifico.evidencia_urls && recursoEspecifico.evidencia_urls.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--border)]">
          <div className="mb-3">
            <span className="text-xs sm:text-sm font-medium text-[var(--text-on-content-bg-heading)]">
              Evidencias ({recursoEspecifico.evidencia_urls.length})
            </span>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
            {recursoEspecifico.evidencia_urls.map((url, index) => (
              <ImageViewer
                key={index}
                url={url}
                alt={`Evidencia ${recursoEspecifico.codigo_recurso} - ${index + 1}`}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function HistorialActivosFijosView({
  isOpen,
  onClose,
  recursoId
}: HistorialActivosFijosViewProps) {
  // Consultar reportes que contienen este recurso
  const { data: reportes, isLoading, error } = useReportesByRecurso(recursoId);

  // Ordenar reportes de más reciente a más antiguo
  const reportesOrdenados = useMemo(() => {
    if (!reportes) return [];
    return [...reportes].sort((a, b) =>
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    );
  }, [reportes]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
            Historial de Reportes
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Reportes ordenados de más reciente a más antiguo
          </p>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs text-[var(--text-secondary)] sm:hidden">
            {reportesOrdenados.length > 0 && `${reportesOrdenados.length} reporte${reportesOrdenados.length !== 1 ? 's' : ''}`}
          </div>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--hover)] text-[var(--text-primary)] text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <LoadingSpinner size={32} showText={true} text="Cargando historial..." />
        </div>
      ) : error ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
            <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] mb-1">
            Error al cargar historial
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            No se pudo obtener la información de los reportes.
          </p>
        </div>
      ) : !reportesOrdenados || reportesOrdenados.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mb-3 sm:mb-4 mx-auto">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] mb-1">
            Sin historial
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Este recurso no ha sido incluido en ningún reporte aún.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)]">
              {reportesOrdenados.length} reporte{reportesOrdenados.length !== 1 ? 's' : ''} encontrado{reportesOrdenados.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {reportesOrdenados.map((reporte) => (
            <ReporteItem
              key={reporte._id || reporte.id_reporte}
              reporte={reporte}
              recursoId={recursoId || ''}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
