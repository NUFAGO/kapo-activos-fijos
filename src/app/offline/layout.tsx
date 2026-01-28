'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowLeft, WifiOff, Wifi, Database, FileText, Trash2, Settings, Home, Menu, Package, Sun, Moon, ClipboardList } from 'lucide-react';
import { useOnline } from '@/hooks';
import { cn } from '@/lib/utils';

interface OfflineLayoutProps {
  children: React.ReactNode;
}

function OfflineHeader({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { status } = useOnline();
  const isOnline = status === 'online';
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Leer el tema inicial del localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Aplicar el tema al documento
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el caché? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      sessionStorage.clear();

      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
      }

      alert('Caché limpiado exitosamente');
      window.location.reload();
    }
  };

  return (
    <header className="flex-none flex h-[60px] items-center justify-between px-4 bg-[var(--header-bg)] sticky top-0 z-10 card-shadow">
      <button
        onClick={toggleSidebar}
        className="flex items-center gap-2 hover:bg-[var(--hover-bg)] p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <Menu className="w-6 h-6" strokeWidth={1.7} />
      </button>

      <div className="flex items-center gap-2 px-3 py-1 bg-[var(--background)] rounded-lg border border-[var(--border)]">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        <span className="text-xs text-[var(--text-secondary)]">
          {isOnline ? 'En línea' : 'Sin conexión'}
        </span>
      </div>

      <button
        onClick={toggleTheme}
        className="hover:bg-[var(--hover-bg)] p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" strokeWidth={2} />
        ) : (
          <Moon className="w-5 h-5" strokeWidth={2} />
        )}
      </button>
    </header>
  );
}

function OfflineSidebar({
  isCollapsed,
  isMobile,
  closeSidebar
}: {
  isCollapsed: boolean;
  isMobile: boolean;
  closeSidebar: () => void;
}) {
  const pathname = usePathname();
  const { status } = useOnline();
  const isOnline = status === 'online';

  const offlineRoutes = [
    {
      name: 'Centro de Control',
      href: '/offline',
      icon: Home,
    },
    {
      name: 'Recursos Activos Fijos',
      href: '/offline/recursos-af',
      icon: Package,
    },
    {
      name: 'Reportes Activos',
      href: '/offline/reporte-activos-fijos',
      icon: FileText,
    },
    {
      name: 'Gestión Reportes',
      href: '/offline/gestion-reportes',
      icon: ClipboardList,
    }
  ];

  const isRouteActive = (href: string) => {
    const cleanPathname = pathname?.replace(/\/$/, '') || '/offline';
    const cleanHref = href.replace(/\/$/, '') || '/offline';

    if (cleanHref === '/offline') {
      return cleanPathname === '/offline' || cleanPathname === '/offline/';
    }

    return cleanPathname === cleanHref || cleanPathname.startsWith(cleanHref + '/');
  };

  const handleClearCache = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el caché? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      sessionStorage.clear();

      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
      }

      alert('Caché limpiado exitosamente');
      window.location.reload();
    }
  };

  return (
    <>
      <div
        className={cn(
          'flex h-full flex-col bg-[var(--sidebar-bg)] transition-all duration-300 card-shadow',
          'fixed md:relative z-30',
          {
            'w-16': isCollapsed && !isMobile,
            'w-60': !isCollapsed,
            '-translate-x-full': isCollapsed && isMobile,
            'translate-x-0': !isCollapsed || !isMobile,
          }
        )}
        style={{ isolation: 'isolate' }}
      >
        <Link
          className="flex h-[60px] items-center justify-center px-4 hover:opacity-90 transition-opacity duration-300"
          href="/offline"
        >
          <div className={cn(
            'w-full flex flex-col items-center justify-center transition-all duration-300 gap-1',
            isCollapsed && !isMobile ? 'scale-75' : ''
          )}>
            {isCollapsed && !isMobile ? (
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-gray-900"
              )}>
                <Image
                  src="/logo-negativo.webp"
                  alt="Activos Fijos Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center transition-all duration-300 rounded-lg bg-gray-900">
                  <Image
                    src="/logo-negativo.webp"
                    alt="Activos Fijos Logo"
                    width={100}
                    height={35}
                    className="h-8 w-auto object-contain"
                    priority
                  />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight text-gray-700">
                  Modo Offline
                </span>
              </>
            )}
          </div>
        </Link>

        <div className={cn('flex flex-col h-[calc(100%-60px)]', {
          'overflow-hidden': isCollapsed && !isMobile,
          'overflow-y-auto': !isCollapsed || isMobile,
        })}>
          <div className="flex flex-col space-y-1 p-3 flex-1 overflow-x-hidden">
            {offlineRoutes.map((item) => {
              const Icon = item.icon;
              const active = item.href ? isRouteActive(item.href) : false;

              return (
                <Link
                  key={item.href || item.name}
                  href={item.href || '#'}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium relative transition-all duration-300 ease-in-out sidebar-nav-item group',
                    {
                      'bg-[var(--sidebar-active-bg-light)] text-[var(--sidebar-active-text-light)] sidebar-nav-item-active border-l-[3px] border-[var(--sidebar-active-bg)]': active,
                      'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]': !active,
                      'justify-center': isCollapsed && !isMobile,
                    }
                  )}
                  title={isCollapsed && !isMobile ? item.name : undefined}
                >
                  {Icon && (
                    <Icon className={cn(
                      'w-5 h-5 flex-shrink-0 transition-all duration-300 ease-in-out',
                      {
                        'text-[var(--sidebar-active-text-light)]': active,
                        'text-[var(--text-secondary)] group-hover:scale-110 group-hover:text-[var(--text-primary)]': !active,
                      }
                    )} />
                  )}
                  {!isCollapsed && (
                    <span className="truncate transition-all duration-300 ease-in-out">{item.name}</span>
                  )}
                </Link>
              );
            })}
            <div className="h-auto w-full grow rounded-md"></div>
          </div>

          <div className="text-center p-2 space-y-1">
            <button
              onClick={handleClearCache}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-1 text-xs p-2 rounded-md bg-[var(--content-bg)] hover:bg-[var(--hover-bg)] w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 ease-in-out sidebar-nav-item group card-shadow',
                isCollapsed && !isMobile && 'justify-center'
              )}
            >
              <Trash2 className="w-4 h-4 transition-all duration-300 ease-in-out group-hover:scale-110" />
              {!isCollapsed && <span>Limpiar Caché</span>}
            </button>
            <Link
              href="/"
              onClick={() => {
                if (isMobile) {
                  closeSidebar();
                }
              }}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-1 text-xs p-2 rounded-md bg-[var(--content-bg)] hover:bg-[var(--hover-bg)] w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 ease-in-out sidebar-nav-item group card-shadow',
                isCollapsed && !isMobile && 'justify-center'
              )}
            >
              {isOnline ? (
                <Wifi className="w-4 h-4 transition-all duration-300 ease-in-out group-hover:scale-110" />
              ) : (
                <WifiOff className="w-4 h-4 transition-all duration-300 ease-in-out group-hover:scale-110" />
              )}
              {!isCollapsed && <span>Volver Online</span>}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OfflineLayout({ children }: OfflineLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Empieza cerrado en móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Si cambia a móvil, cerrar sidebar automáticamente
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else if (!mobile && isSidebarCollapsed) {
        // Si vuelve a desktop y estaba cerrado, abrirlo
        setIsSidebarCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-[var(--background)]">
        <OfflineSidebar
          isCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
          closeSidebar={closeSidebar}
        />

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <OfflineHeader toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-[var(--content-bg)] p-4 sm:p-6">
          {children}
        </main>
        </div>
      </div>

      {/* Overlay para móvil */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-20',
          isMobile && !isSidebarCollapsed ? 'block' : 'hidden'
        )}
        onClick={closeSidebar}
      />
    </>
  );
}
