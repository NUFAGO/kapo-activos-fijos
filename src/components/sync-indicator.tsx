/**
 * Componente para mostrar el estado de sincronización offline/online
 * Indica cuando hay datos pendientes de sincronizar o procesos en curso
 */

'use client';

import React from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useOnline } from '@/hooks';
import { getSyncQueueManager } from '@/lib/db';
import type { DBStats } from '@/lib/db';

interface SyncIndicatorProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function SyncIndicator({
  className,
  showDetails = false,
  compact = false
}: SyncIndicatorProps) {
  const { status: connectionStatus } = useOnline();
  const [syncStats, setSyncStats] = React.useState<DBStats | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Cargar estadísticas de sync
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const manager = getSyncQueueManager();
        const stats = await manager.getStats();
        setSyncStats({
          informes: { total: 0, pending: stats.pending, error: stats.failed, synced: stats.completed },
          syncQueue: { total: stats.total, pending: stats.pending, failed: stats.failed },
          referenceData: { total: 0, expired: 0 },
          storage: { used: 0, available: 0, quota: 0 }
        });
        setIsSyncing(manager.isCurrentlyProcessing());
      } catch (error) {
        console.error('[SyncIndicator] Failed to load stats:', error);
      }
    };

    loadStats();

    // Actualizar cada 5 segundos
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Determinar estado general
  const getStatusConfig = () => {
    const hasPendingSync = (syncStats?.syncQueue.pending ?? 0) > 0;
    const hasErrors = (syncStats?.syncQueue.failed ?? 0) > 0;
    const isOnline = connectionStatus === 'online';

    if (isSyncing) {
      return {
        status: 'syncing',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: RefreshCw,
        title: 'Sincronizando...',
        message: 'Enviando datos al servidor',
      };
    }

    if (hasErrors && isOnline) {
      return {
        status: 'error',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: AlertCircle,
        title: 'Errores de sincronización',
        message: `${syncStats?.syncQueue.failed} elementos con error`,
      };
    }

    if (hasPendingSync && isOnline) {
      return {
        status: 'pending',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: Clock,
        title: 'Datos pendientes',
        message: `${syncStats?.syncQueue.pending} elementos por sincronizar`,
      };
    }

    if (hasPendingSync && !isOnline) {
      return {
        status: 'offline_pending',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: CloudOff,
        title: 'Modo offline',
        message: `${syncStats?.syncQueue.pending} elementos listos para sync`,
      };
    }

    if (isOnline) {
      return {
        status: 'synced',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        title: 'Sincronizado',
        message: 'Todos los datos están al día',
      };
    }

    return {
      status: 'offline',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: WifiOff,
      title: 'Sin conexión',
      message: 'Conéctate para sincronizar',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    // Versión compacta (solo icono con tooltip)
    return (
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor} ${className}`}
        title={config.title}
      >
        <Icon className={`w-4 h-4 ${config.color} ${isSyncing ? 'animate-spin' : ''}`} />
      </div>
    );
  }

  // Versión completa
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor} ${className}`}>
      <div className={`flex-shrink-0 ${config.color}`}>
        <Icon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.color}`}>
          {config.title}
        </p>
        <p className={`text-xs ${config.color} opacity-75`}>
          {config.message}
        </p>

        {showDetails && syncStats && (
          <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-600">Pendientes:</span>
              <span className="ml-1 font-medium">{syncStats.syncQueue.pending}</span>
            </div>
            <div>
              <span className="text-gray-600">Errores:</span>
              <span className="ml-1 font-medium text-red-600">{syncStats.syncQueue.failed}</span>
            </div>
          </div>
        )}
      </div>

      {/* Badge de conexión */}
      <div className="flex-shrink-0">
        {connectionStatus === 'online' ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-gray-600" />
        )}
      </div>
    </div>
  );
}

/**
 * Badge pequeño con contador de elementos pendientes
 */
export function SyncBadge() {
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const loadCount = async () => {
      try {
        const manager = getSyncQueueManager();
        const stats = await manager.getStats();
        setPendingCount(stats.pending);
      } catch (error) {
        console.error('[SyncBadge] Failed to load count:', error);
      }
    };

    loadCount();
    const interval = setInterval(loadCount, 10000); // Cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) {
    return (
      <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
        <CheckCircle className="w-4 h-4 text-green-600" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center min-w-6 h-6 bg-yellow-100 rounded-full px-2">
      <span className="text-xs font-medium text-yellow-800">
        {pendingCount > 99 ? '99+' : pendingCount}
      </span>
    </div>
  );
}

/**
 * Hook para acceder al estado de sincronización
 */
export function useSyncStatus() {
  const [stats, setStats] = React.useState<DBStats | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const loadStatus = async () => {
      try {
        const manager = getSyncQueueManager();
        const queueStats = await manager.getStats();

        setStats({
          informes: { total: 0, pending: queueStats.pending, error: queueStats.failed, synced: queueStats.completed },
          syncQueue: { total: queueStats.total, pending: queueStats.pending, failed: queueStats.failed },
          referenceData: { total: 0, expired: 0 },
          storage: { used: 0, available: 0, quota: 0 }
        });

        setIsSyncing(manager.isCurrentlyProcessing());
      } catch (error) {
        console.error('[useSyncStatus] Failed to load status:', error);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    isSyncing,
    hasPendingSync: (stats?.syncQueue.pending ?? 0) > 0,
    hasErrors: (stats?.syncQueue.failed ?? 0) > 0,
  };
}
