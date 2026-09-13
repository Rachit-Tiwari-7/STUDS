'use client';

import React from 'react';
import { Flame, Maximize2, Moon, Sun, User as UserIcon, LogOut, Cloud } from 'lucide-react';

interface HeaderProps {
  streak: number;
  isDark: boolean;
  onToggleTheme: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onOpenMobileMenu?: () => void;
  activeViewTitle?: string;
  user?: { email?: string; id?: string } | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  isSyncingCloud?: boolean;
  onSyncCloud?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  isDark,
  onToggleTheme,
  isFocusMode,
  onToggleFocus,
  onOpenMobileMenu,
  activeViewTitle,
  user,
  onOpenAuthModal,
  onSignOut,
  isSyncingCloud,
  onSyncCloud,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[var(--card-bg)] border-b-[var(--border-thick)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-sm no-print">
      {/* Brand & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-[var(--radius-sm)] border-[var(--border-thin)] bg-[var(--card-bg-alt)] hover:bg-[var(--brand-yellow)] cursor-pointer font-black"
            title="Open Features Menu"
          >
            ☰
          </button>
        )}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
          className="studs-brand-logo cursor-pointer"
        >
          <span className="text-xl">⚡</span>
          <span className="tracking-widest font-studs">STUDS</span>
        </a>
        {activeViewTitle && (
          <span className="hidden md:inline-flex items-center gap-1.5 bg-[var(--brand-blue-light)] text-[var(--brand-blue)] border-[var(--border-thin)] rounded-full px-3 py-1 text-xs font-black">
            <span>📍</span> {activeViewTitle}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Streak Flame */}
        <div
          className="flex items-center gap-1.5 bg-[var(--brand-yellow)] border-[var(--border-thin)] rounded-full px-3.5 py-1 text-xs sm:text-sm font-extrabold text-[#111827] shadow-[var(--shadow-sm)]"
          title="Daily study streak!"
        >
          <Flame className="w-4 h-4 text-orange-600 animate-bounce" />
          <span>{streak} Day Streak</span>
        </div>

        {/* Focus Mode */}
        <button
          onClick={onToggleFocus}
          className="btn-comic btn-comic-sm hidden sm:inline-flex"
          title="Distraction-Free Focus Mode"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{isFocusMode ? 'Normal' : 'Focus'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="btn-comic btn-comic-sm px-2.5 py-1.5 rounded-full"
          title="Toggle Dark/Light Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Supabase Auth & Cloud Sync */}
        {user ? (
          <div className="flex items-center gap-1.5">
            {onSyncCloud && (
              <button
                onClick={onSyncCloud}
                disabled={isSyncingCloud}
                className="btn-comic btn-comic-sm hidden md:inline-flex items-center gap-1 bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)] border-[var(--border-thin)] cursor-pointer"
                title="Sync workspace to Supabase cloud"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs">
                  {isSyncingCloud ? 'Syncing...' : 'Sync'}
                </span>
              </button>
            )}
            <div
              className="flex items-center gap-1.5 bg-[var(--brand-purple-light)] dark:bg-purple-950/60 border-[var(--border-thin)] rounded-full pl-1.5 pr-2.5 py-0.5 text-xs font-bold text-[var(--brand-purple)] dark:text-purple-300"
              title={`Logged in as ${user.email}`}
            >
              <span className="w-5 h-5 rounded-full bg-[var(--brand-purple)] text-white flex items-center justify-center text-[10px] font-black uppercase">
                {user.email?.[0] || 'U'}
              </span>
              <span className="hidden sm:inline max-w-[100px] truncate text-xs font-extrabold text-[var(--text-main)]">
                {user.email?.split('@')[0]}
              </span>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="btn-comic btn-comic-sm px-2 py-1.5 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="btn-comic btn-comic-sm bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)] cursor-pointer font-bold flex items-center gap-1.5"
              title="Sign in with Supabase"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
