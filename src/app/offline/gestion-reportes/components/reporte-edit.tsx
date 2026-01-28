'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, User, Package, X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SelectSearch } from '@/components/ui/select-search';
import { Textarea } from '@/components/ui/textarea';
import { getRecursosFromIndexedDB, getDB, updateReporteOffline } from '@/lib/db';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface RecursoEditable {
  id_recurso: string;
  codigo_recurso: string;
  nombre_recurso: string;
  marca: string;
  estado: 'Operativo' | 'Observado' | 'Inoperativo' | 'No encontrado';
  descripcion: string;
  evidencia_urls: string[];
  evidence_files: Blob[];
}

interface ReporteOffline {
  id: string;
  titulo: string;
  recursos: RecursoEditable[];
  usuario_nombres?: string;
  fecha_creacion: number;
  sync_status: 'pending' | 'synced' | 'error';
}

interface ReporteOfflineEditProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: ReporteOffline | null;
  onSaved?: () => void;
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return '-';
  try {
    return new Date(timestamp).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
};

const getEstadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    Operativo: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    Observado: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    Inoperativo: 'bg-red-500/10 text-red-600 dark:text-red-400',
    'No encontrado': 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  };
  return map[estado] ?? 'bg-[var(--muted)]';
};

function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-md">
      <div className="w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-[var(--card-bg)] rounded-xl sm:rounded-2xl shadow-xl border border-white/10 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}

function BlobThumb({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return null;
  return (
    <div className="w-10 h-10 rounded border border-[var(--border)] overflow-hidden bg-[var(--surface)] flex-shrink-0">
      <img src={url} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

export default function ReporteOfflineEdit({
  isOpen,
  onClose,
  reporte,
  onSaved,
}: ReporteOfflineEditProps) {
  const [recursos, setRecursos] = useState<RecursoEditable[]>([]);
  const [opcionesDisponibles, setOpcionesDisponibles] = useState<
    Array<{ value: string; label: string; data?: any }>
  >([]);
  const [opcionesFiltradas, setOpcionesFiltradas] = useState<
    Array<{ value: string; label: string; data?: any }>
  >([]);
  const [saving, setSaving] = useState(false);
  const recursosMapRef = useRef<Map<string, any>>(new Map());

  const opcionesRecursos = opcionesFiltradas.length > 0 ? opcionesFiltradas : opcionesDisponibles;
  const opcionesForSelect = opcionesRecursos.map((o) => ({ value: o.value, label: o.label }));

  useEffect(() => {
    if (!reporte || !isOpen) return;
    setRecursos(
      reporte.recursos.map((r) => ({
        ...r,
        descripcion: r.descripcion ?? '',
        evidencia_urls: r.evidencia_urls ?? [],
        evidence_files: r.evidence_files ?? [],
      }))
    );
  }, [reporte, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const list = await getRecursosFromIndexedDB();
        recursosMapRef.current.clear();
        const opciones = list.map((r: any) => {
          recursosMapRef.current.set(r.id, r);
          return {
            value: r.id,
            label: `${r.codigo || ''} - ${r.nombre || ''}`.trim() || r.id,
            data: r,
          };
        });
        setOpcionesDisponibles(opciones);
        setOpcionesFiltradas([]);
      } catch (e) {
        console.error(e);
        toast.error('Error al cargar recursos');
      }
    };
    load();
  }, [isOpen]);

  const buscarRecursos = useCallback(
    async (term: string): Promise<Array<{ value: string; label: string }>> => {
      if (!term.trim()) {
        setOpcionesFiltradas([]);
        return opcionesDisponibles.map((o) => ({ value: o.value, label: o.label }));
      }
      const lower = term.toLowerCase();
      const filtered = opcionesDisponibles.filter((o) => {
        const d = o.data;
        return (
          d?.nombre?.toLowerCase().includes(lower) ||
          d?.codigo?.toLowerCase().includes(lower) ||
          d?.descripcion?.toLowerCase().includes(lower)
        );
      });
      setOpcionesFiltradas(filtered);
      return filtered.map((o) => ({ value: o.value, label: o.label }));
    },
    [opcionesDisponibles]
  );

  const updateRecurso = (index: number, patch: Partial<RecursoEditable>) => {
    setRecursos((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  };

  const handleRecursoChange = (index: number, recursoId: string | null) => {
    if (!recursoId) return;
    const r = recursosMapRef.current.get(recursoId) ?? opcionesRecursos.find((o) => o.value === recursoId)?.data;
    if (!r) return;
    updateRecurso(index, {
      id_recurso: r.id,
      codigo_recurso: r.codigo ?? '',
      nombre_recurso: r.nombre ?? '',
    });
  };

  const handleGuardar = async () => {
    if (!reporte) return;
    setSaving(true);
    try {
      const total_recursos = recursos.length;
      const total_imagenes = recursos.reduce((s, r) => s + (r.evidence_files?.length ?? 0), 0);
      await updateReporteOffline(reporte.id, {
        recursos,
        total_recursos,
        total_imagenes,
      });
      toast.success('Reporte actualizado');
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!reporte) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sticky top-0 z-10 bg-[var(--header-bg)]/95 backdrop-blur-md border-b border-[var(--border)] px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--primary)]/10">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate">
                  Editar reporte
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {reporte.titulo} · Creado: {formatDate(reporte.fecha_creacion)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--card-bg)] text-xs">
                <User className="h-3.5 w-3.5" />
                <span className="truncate max-w-32">{reporte.usuario_nombres || 'Usuario'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--card-bg)] text-xs">
                <Package className="h-3.5 w-3.5" />
                {recursos.length} recurso{recursos.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Por ahora solo se editan: recurso (SelectSearch), descripción e imágenes. Tal vez en el futuro permitir editar estado, marca, etc. */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-3">
        {recursos.map((r, index) => (
          <div
            key={`${r.id_recurso}-${index}`}
            className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-[var(--card-bg)]/95 rounded-lg sm:rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden card-shadow hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.1)] hover:-translate-y-[1px] transition-all duration-300 p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0 sm:min-w-[200px]">
                <label className="sr-only">Cambiar recurso</label>
                <SelectSearch
                  value={r.id_recurso}
                  onChange={(v) => handleRecursoChange(index, v ?? '')}
                  options={opcionesForSelect}
                  onSearch={buscarRecursos}
                  placeholder="Buscar recurso..."
                  showSearchIcon
                  minCharsForSearch={1}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium',
                    getEstadoBadge(r.estado)
                  )}
                >
                  {r.estado === 'Operativo' && <CheckCircle className="h-2.5 w-2.5" />}
                  {r.estado === 'Observado' && <AlertTriangle className="h-2.5 w-2.5" />}
                  {r.estado === 'Inoperativo' && <XCircle className="h-2.5 w-2.5" />}
                  {r.estado}
                </span>
                {r.marca && r.marca !== 'Marca Desconocida' && (
                  <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-20">{r.marca}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-0.5">Descripción</label>
              <Textarea
                value={r.descripcion}
                readOnly
                placeholder="Descripción del recurso..."
                className="min-h-[56px] text-xs resize-none py-1.5 px-2 bg-[var(--muted)]/30 cursor-default"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {r.evidence_files?.map((blob, i) => (
                <BlobThumb key={i} blob={blob} />
              ))}
              {(!r.evidence_files?.length) && (
                <span className="text-[10px] text-[var(--text-secondary)]">Sin imágenes</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--card-bg)]/95 backdrop-blur px-3 sm:px-6 py-4 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--muted-foreground)] text-xs font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-primary-foreground text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </button>
      </div>
    </Modal>
  );
}
