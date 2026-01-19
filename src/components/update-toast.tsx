/**
 * Componente para mostrar notificación de actualización disponible
 * Aparece cuando hay una nueva versión del Service Worker
 */

'use client';

import React from 'react';
import { RefreshCw, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateNotification } from '@/hooks';

interface UpdateToastProps {
  className?: string;
}

export function UpdateToast({ className }: UpdateToastProps) {
  const { showUpdate, applyUpdate, dismissUpdate } = useUpdateNotification();

  // No mostrar si no hay actualización
  if (!showUpdate) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2 duration-300">

        {/* Header con icono */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Título */}
            <h3 className="text-sm font-semibold text-gray-900">
              Nueva versión disponible
            </h3>

            {/* Descripción */}
            <p className="text-sm text-gray-600 mt-1">
              Hay una actualización disponible con mejoras y correcciones.
              Se recomienda instalarla ahora.
            </p>

            {/* Información adicional */}
            <div className="mt-3 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> La aplicación se recargará automáticamente
                después de instalar la actualización.
              </p>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={dismissUpdate}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={applyUpdate}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Instalar ahora
          </Button>

          <Button
            onClick={dismissUpdate}
            variant="outline"
            size="sm"
            className="px-4"
          >
            Después
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Versión simplificada del toast (solo banner superior)
 */
export function UpdateBanner() {
  const { showUpdate, applyUpdate, dismissUpdate } = useUpdateNotification();

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5" />
          <div>
            <p className="font-medium">
              Nueva versión disponible
            </p>
            <p className="text-sm text-blue-100">
              Haz click para instalar las últimas mejoras
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={applyUpdate}
            size="sm"
            variant="outline"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Instalar
          </Button>

          <Button
            onClick={dismissUpdate}
            size="sm"
            variant="ghost"
            className="text-white hover:bg-blue-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de notificación que puede ser usado globalmente
 * Se integra con React Hot Toast
 */
export function useUpdateToast() {
  const { showUpdate, applyUpdate, dismissUpdate } = useUpdateNotification();

  React.useEffect(() => {
    if (showUpdate) {
      // Aquí se podría integrar con toast library
      console.log('[UpdateToast] Showing update notification');
    }
  }, [showUpdate]);

  return {
    showUpdate,
    applyUpdate,
    dismissUpdate,
  };
}
