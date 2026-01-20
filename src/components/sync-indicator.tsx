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
import { useOnline } from '@/hooks/use-online';
import { getDBStats } from '@/lib/db';
import type { DBStats } from '@/lib/db';
import type { ConnectionStatus } from '@/lib/db';

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
  const onlineState = useOnline();
  const connectionStatus = (onlineState as any).status as ConnectionStatus;
  const [syncStats, setSyncStats] = React.useState<DBStats | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Cargar estadísticas de DB
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getDBStats();
        setSyncStats(stats);
        // No hay más sync processing ya que eliminamos syncQueue
        setIsSyncing(false);
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
    // Ahora usamos reportesOffline en lugar de syncQueue
    const hasPendingSync = (syncStats?.reportesOffline ?? 0) > 0;
    const hasErrors = false; // Ya no trackeamos errores específicos
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
        message: 'Hay errores en reportes offline',
      };
    }

    if (hasPendingSync && isOnline) {
      return {
        status: 'pending',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: Clock,
        title: 'Datos pendientes',
        message: `${syncStats?.reportesOffline} reportes offline`,
      };
    }

    if (hasPendingSync && !isOnline) {
      return {
        status: 'offline_pending',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: CloudOff,
        title: 'Modo offline',
        message: `${syncStats?.reportesOffline} reportes offline pendientes`,
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
              <span className="text-gray-600">Reportes offline:</span>
              <span className="ml-1 font-medium">{syncStats.reportesOffline}</span>
            </div>
            <div>
              <span className="text-gray-600">Recursos cache:</span>
              <span className="ml-1 font-medium">{syncStats.recursos}</span>
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
        const stats = await getDBStats();
        setPendingCount(stats.reportesOffline);
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
        const dbStats = await getDBStats();
        setStats(dbStats);
        setIsSyncing(false); // Ya no hay sync processing
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
    hasPendingSync: (stats?.reportesOffline ?? 0) > 0,
    hasErrors: false, // Ya no trackeamos errores específicos
  };
}
