'use client';

import React, { useState } from 'react';
import { Modal, Input, Select, SelectSearch, Textarea } from '@/components/ui';
import { useUnidadesOfflineOptions } from '@/hooks/useUnidadesOffline';
import { useClasificacionesOfflineJerarquicas } from '@/hooks/useClasificacionesOffline';
import { InputFilters } from '@/utils';
import toast from 'react-hot-toast';

export interface CrearRecursoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    nombre: string;
    descripcion: string;
    unidadId: string;
    clasificacionId: string;
    precioActual: string;
  }) => void;
}

export default function CrearRecursoForm({ isOpen, onClose, onSubmit }: CrearRecursoFormProps) {
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadId, setUnidadId] = useState<string>('');
  const [clasificacionId, setClasificacionId] = useState<string | null>(null);
  const [precioActual, setPrecioActual] = useState<string>('');

  const labelClass = 'block text-xs font-medium text-[var(--text-primary)] mb-1';
  const fieldClass = 'text-xs';

  // Función para limpiar todos los estados del formulario
  const clearForm = () => {
    setNombre('');
    setDescripcion('');
    setUnidadId('');
    setClasificacionId(null);
    setPrecioActual('');
  };

  // Cargar datos del backend (IndexedDB primero, luego servidor)
  const { options: opcionesUnidades, isLoading: loadingUnidades } = useUnidadesOfflineOptions();
  const { options: opcionesClasificaciones, isLoading: loadingClasificaciones } = useClasificacionesOfflineJerarquicas();

  // Las unidades ya vienen formateadas desde el hook offline

  // Las clasificaciones ya vienen formateadas jerárquicamente desde el hook offline

  // Limpiar todos los estados cuando se cierra el modal
  React.useEffect(() => {
    if (!isOpen) {
      clearForm();
    }
  }, [isOpen, clearForm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // Limpiar estados antes de cerrar
        clearForm();
        onClose();
      }}
      title="Crear recurso"
      size="md"
      footer={
        <div className="flex justify-end gap-2 px-6">
          <button
            type="button"
            onClick={() => {
              // Limpiar estados antes de cerrar
              clearForm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--background)]/50 hover:bg-[var(--background)]/70 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button
            type="submit"
            form="crear-recurso-form"
            disabled={loadingUnidades || loadingClasificaciones}
            className="px-6 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            onClick={() => console.log('Botón Crear clickeado')}
          >
            {loadingUnidades || loadingClasificaciones ? 'Cargando...' : 'Crear'}
          </button>
        </div>
      }
    >
      <form
        id="crear-recurso-form"
        className="space-y-4 p-3"
        onSubmit={(e) => {
          e.preventDefault();

          // Validar campos requeridos
          if (!nombre.trim()) {
            toast.error('El nombre es obligatorio');
            return;
          }
          if (!unidadId) {
            toast.error('Debe seleccionar una unidad');
            return;
          }
          if (!clasificacionId) {
            toast.error('Debe seleccionar una clasificación');
            return;
          }
          if (!precioActual.trim()) {
            toast.error('El precio es obligatorio');
            return;
          }
          if (!descripcion.trim()) {
            toast.error('La descripción es obligatoria');
            return;
          }

          // Llamar a la función onSubmit si existe
          if (onSubmit) {
            console.log('Llamando a onSubmit con:', {
              nombre,
              descripcion,
              unidadId,
              clasificacionId,
              precioActual,
            });

            onSubmit({
              nombre,
              descripcion,
              unidadId,
              clasificacionId,
              precioActual,
            });

            toast.success('Recurso creado correctamente');
          }

          // Limpiar estados y cerrar modal
          clearForm();
          onClose();
        }}
      >
        {/* Nombre */}
        <div>
          <label htmlFor="crear-nombre" className={labelClass}>
            Nombre <span className="text-red-500">*</span>
          </label>
          <Input
            id="crear-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del recurso"
            className={fieldClass}
          />
        </div>

        {/* Unidad y Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Unidad <span className="text-red-500">*</span>
            </label>
            <SelectSearch
              value={unidadId || null}
              onChange={(value) => setUnidadId(value || '')}
              options={opcionesUnidades}
              message="Seleccionar unidad"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="crear-precio" className={labelClass}>
              Precio <span className="text-red-500">*</span>
            </label>
            <Input
              id="crear-precio"
              type="text"
              value={precioActual}
              onChange={(e) => {
                const filtered = InputFilters.currency(e.target.value, { maxDecimals: 4 });
                setPrecioActual(filtered);
              }}
              placeholder="0.00"
              className={fieldClass}
            />
          </div>
        </div>

        {/* Clasificación */}
        <div>
          <label className={labelClass}>
            Clasificación <span className="text-red-500">*</span>
          </label>
          <Select
            value={clasificacionId}
            onChange={(v) => setClasificacionId(v)}
            options={opcionesClasificaciones}
            placeholder={loadingClasificaciones ? "Cargando clasificaciones..." : "--Seleccionar clasificación--"}
            disabled={loadingClasificaciones}
          />
        </div>

        {/* Descripción - Al final */}
        <div>
          <label htmlFor="crear-descripcion" className={labelClass}>
            Descripción <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="crear-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del recurso"
            rows={4}
            className={fieldClass}
          />
        </div>
      </form>
    </Modal>
  );
}
