'use client';

import React from 'react';
import { Flame, Cloud, Cpu, Maximize2, Moon, Sun, Globe } from 'lucide-react';

interface HeaderProps {
  streak: number;
  isDark: boolean;
  onToggleTheme: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onOpenGroqModal: () => void;
  onOpenSupabaseModal: () => void;
  groqKeysCount: number;
  groqModel: string;
  supabaseConfigured: boolean;
  userEmail: string | null;
  openRouterKeyConfigured: boolean;
  onOpenOpenRouterModal: () => void;
  onOpenMobileMenu?: () => void;
  activeViewTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  isDark,
  onToggleTheme,
  isFocusMode,
  onToggleFocus,
  onOpenGroqModal,
  onOpenSupabaseModal,
  groqKeysCount,
  groqModel,
  supabaseConfigured,
  userEmail,
  openRouterKeyConfigured,
  onOpenOpenRouterModal,
  onOpenMobileMenu,
  activeViewTitle,
}) => {
  const shortModel = groqModel.includes('120b')
    ? 'GPT-OSS 120B'
    : groqModel.includes('qwen')
    ? 'Qwen 27B'
    : 'Compound';

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

        {/* OpenRouter Vision OCR Button */}
        <button
          onClick={onOpenOpenRouterModal}
          className="flex items-center gap-1.5 bg-[var(--card-bg-alt)] hover:bg-[var(--brand-blue-light)] text-[#111827] border-[var(--border-thin)] rounded-full px-3 py-1 text-xs font-black shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 cursor-pointer"
          title="Configure OpenRouter API & Vision OCR"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full border border-black ${
              openRouterKeyConfigured ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <Globe className="w-3.5 h-3.5 text-[var(--brand-blue)]" />
          <span>{openRouterKeyConfigured ? 'OpenRouter: Active' : 'OpenRouter OCR'}</span>
        </button>

        {/* Groq Cloud LPU Status */}
        <button
          onClick={onOpenGroqModal}
          className="flex items-center gap-1.5 bg-[var(--brand-yellow)] hover:bg-[var(--brand-yellow-hover)] text-[#111827] border-[var(--border-thin)] rounded-full px-3 py-1 text-xs font-black shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 cursor-pointer"
          title="Configure Groq LPU Multi-Key Pool"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full border border-black ${
              groqKeysCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <Cpu className="w-3.5 h-3.5" />
          <span>
            {groqKeysCount > 1
              ? `Groq Pool (${groqKeysCount} Keys)`
              : groqKeysCount === 1
              ? `Groq: ${shortModel}`
              : 'Groq: Demo'}
          </span>
        </button>

        {/* Supabase Status */}
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-1.5 bg-[var(--card-bg-alt)] hover:bg-[var(--brand-blue-light)] border-[var(--border-thin)] rounded-full px-3 py-1 text-xs font-extrabold shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 cursor-pointer"
          title="Configure Supabase Cloud Sync"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full border border-black ${
              userEmail ? 'bg-blue-500' : supabaseConfigured ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          <Cloud className="w-3.5 h-3.5" />
          <span className="max-w-[110px] truncate">
            {userEmail ? userEmail : supabaseConfigured ? 'Connected' : 'Offline'}
          </span>
        </button>

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
