'use client';

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Bienvenido al sistema de gestión de activos fijos
          </p>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">📦</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Activos</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">💰</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Valor Total</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">S/ 0.00</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Activos con Alertas</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">📊</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Depreciación Mensual</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">S/ 0.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel izquierdo */}
        <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Activos Recientes
          </h2>
          <div className="text-center py-8 text-[var(--text-secondary)]">
            <span className="text-4xl mb-2 block">📦</span>
            <p>No hay activos registrados aún</p>
            <p className="text-sm mt-1">Comienza agregando tu primer activo</p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="bg-[var(--background)] backdrop-blur-sm rounded-lg card-shadow p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Próximas Acciones
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <span className="text-blue-600 dark:text-blue-400">➕</span>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Agregar primer activo</p>
                <p className="text-xs text-[var(--text-secondary)]">Registra tu primer activo fijo</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <span className="text-green-600 dark:text-green-400">📋</span>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Configurar categorías</p>
                <p className="text-xs text-[var(--text-secondary)]">Define las categorías de tus activos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <span className="text-purple-600 dark:text-purple-400">📊</span>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Ver reportes</p>
                <p className="text-xs text-[var(--text-secondary)]">Genera reportes de depreciación</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}