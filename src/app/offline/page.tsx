'use client';

import React, { useState } from 'react';
import { WifiOff, Wifi, RefreshCw, Home, FileText, Database, Trash2, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import SyncDataForm from './components/sync-data-form';
import { useOnline } from '@/hooks';

export default function OfflinePage() {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const { status } = useOnline();

  const isOnline = status === 'online';
  const isOffline = status === 'offline';

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el caché? Esta acción no se puede deshacer.')) {
      // Limpiar localStorage
      localStorage.clear();

      // Limpiar sessionStorage
      sessionStorage.clear();

      // Limpiar IndexedDB si existe
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

      // Limpiar service worker cache
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
      }

      alert('Caché limpiado exitosamente');
      window.location.reload();
    }
  };

  const offlinePages = [
    {
      title: 'Reportes de Activos Fijos',
      description: 'Generar reportes de evaluación de activos fijos',
      icon: FileText,
      href: '/offline/reporte-activos-fijos',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    // Aquí se pueden agregar más páginas offline en el futuro
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Centro de Control
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Funciones disponibles sin conexión a internet
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
        </div>
      </div>

      {/* Estado de Conexión */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-md text-[var(--text-primary)]">
                {isOnline ? 'Conectado' : 'Sin conexión'}
              </h3>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 shadow-sm hover:shadow transition-all duration-200 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Verificar conexión
          </button>
        </div>
      </div>

      {/* Centro de Navegación */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-[var(--text-primary)]" />
            <h2 className="text-md font-semibold text-[var(--text-primary)]">
              Centro de Funciones
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offlinePages.map((page, index) => (
              <Link
                key={index}
                href={page.href}
                className="block p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 ${page.bgColor} rounded-lg group-hover:scale-105 transition-transform`}>
                    <page.icon className={`w-6 h-6 ${page.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {page.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {/* Espacio para futuras funciones */}
            <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg border-dashed">
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <div className="text-center">
                  <Zap className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    Próximamente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Panel de Utilidades */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-[var(--text-primary)]" />
            <h2 className="text-md font-semibold text-[var(--text-primary)]">
              Utilidades
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sincronización de Datos */}
            <button
              onClick={() => setShowSyncModal(true)}
              className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium text-[var(--text-primary)]">Sincronizar Datos</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Sincronizar datos pendientes al reconectar
              </p>
            </button>

            {/* Limpiar Cache */}
            <button
              onClick={handleClearCache}
              className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-medium text-[var(--text-primary)]">Limpiar Caché</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Limpiar datos temporales y caché
              </p>
            </button>
          </div>
        </div>

      {/* Información del Sistema */}
      <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--text-secondary)]">
              Sistema de Activos Fijos v0.1.0
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200 rounded-lg"
            >
              <Home className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>

      {/* Modal de Sincronización */}
      <SyncDataForm
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
      />
    </div>
  );
}
