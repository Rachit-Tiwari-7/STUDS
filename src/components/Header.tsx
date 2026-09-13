'use client';

import React from 'react';
import { Flame, Maximize2, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  streak: number;
  isDark: boolean;
  onToggleTheme: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onOpenMobileMenu?: () => void;
  activeViewTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  isDark,
  onToggleTheme,
  isFocusMode,
  onToggleFocus,
  onOpenMobileMenu,
  activeViewTitle,
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
      </div>
    </header>
  );
};
