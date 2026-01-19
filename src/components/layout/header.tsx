'use client';

import { useEffect, useState } from 'react';
import { Menu, Sun, Moon, Bell, Settings } from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/context/theme-context';
import { useAuth } from '@/hooks';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (user) {
      setUserName(user.nombresA || user.usuario || 'Usuario');
    }
  }, [user]);

  return (
    <header
      className="flex-none flex h-[60px] items-center justify-between px-4 bg-[var(--header-bg)] sticky top-0 z-10 card-shadow"
    >
      <button
        onClick={toggleSidebar}
        className="flex items-center gap-2 hover:bg-[var(--hover-bg)] p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <Menu className="w-6 h-6" strokeWidth={1.7} />
      </button>
      <div className="flex items-center">
        <ul className="flex items-center gap-2 md:gap-5">
          <li
            onClick={toggleTheme}
            className="hover:bg-[var(--hover-bg)] p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hidden md:block cursor-pointer transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" strokeWidth={2} />
            ) : (
              <Moon className="w-5 h-5" strokeWidth={2} />
            )}
          </li>
          <li className="hover:bg-[var(--hover-bg)] p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hidden md:block cursor-pointer transition-colors">
            <Bell className="w-5 h-5" strokeWidth={2} />
          </li>
          <li className="hidden md:flex items-center text-[var(--text-secondary)] gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-xs">
              <span className="text-[var(--text-primary)] text-center font-semibold">
                {userName}
              </span>
            </div>
          </li>
          <li className="hover:bg-[var(--hover-bg)] p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <Settings
              className="w-5 h-5 animate-spin"
              strokeWidth={2}
              style={{ animationDuration: '5000ms' }}
            />
          </li>
        </ul>
      </div>
    </header>
  );
}
