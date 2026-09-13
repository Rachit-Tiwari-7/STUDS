'use client';

import React from 'react';
import {
  LayoutDashboard,
  Camera,
  BookOpen,
  BookMarked,
  GitBranch,
  HelpCircle,
  Layers,
  CheckSquare,
  Calendar,
  Printer,
  ChevronLeft,
  ChevronRight,
  Flame,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { ActiveViewType, WorkspaceData } from '../lib/types';

interface SidebarProps {
  activeView: ActiveViewType;
  onSelectView: (view: ActiveViewType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  workspace: WorkspaceData;
  streak: number;
  isDark: boolean;
  onToggleTheme: () => void;
  isWorkspaceReady?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  workspace,
  streak,
  isDark,
  onToggleTheme,
  isWorkspaceReady = false,
}) => {
  const scheduleDone = isWorkspaceReady
    ? workspace.schedule?.filter((s) => s.done).length || 0
    : 0;

  const navCategories = [
    {
      category: 'WORKSPACE',
      items: [
        {
          id: 'dashboard' as ActiveViewType,
          label: 'All-in-One Dashboard',
          short: 'Dashboard',
          icon: LayoutDashboard,
          symbol: '⚡',
          badge: null,
        },
        {
          id: 'ocr' as ActiveViewType,
          label: 'Handwritten OCR',
          short: 'OCR Scanner',
          icon: Camera,
          symbol: '📷',
          badge: 'FREE',
          badgeColor: 'bg-emerald-200 text-emerald-900 border-emerald-500',
        },
      ],
    },
    {
      category: 'STUDY & RETENTION',
      items: [
        {
          id: 'notes' as ActiveViewType,
          label: 'Revision Notes & Spoilers',
          short: 'Notes',
          icon: BookOpen,
          symbol: '📝',
          badge: isWorkspaceReady ? `${workspace.sections?.length || 0} parts` : null,
        },
        {
          id: 'glossary' as ActiveViewType,
          label: 'Key Terms & Mnemonics',
          short: 'Glossary',
          icon: BookMarked,
          symbol: '📖',
          badge: isWorkspaceReady ? `${workspace.glossary?.length || 0}` : null,
        },
        {
          id: 'mindmap' as ActiveViewType,
          label: 'Interactive Mind Map',
          short: 'Mind Map',
          icon: GitBranch,
          symbol: '🌳',
          badge: null,
        },
      ],
    },
    {
      category: 'PRACTICE & TESTING',
      items: [
        {
          id: 'quiz' as ActiveViewType,
          label: '5-Question Quiz & Exam',
          short: 'Quiz',
          icon: HelpCircle,
          symbol: '❓',
          badge: isWorkspaceReady ? `${workspace.quiz?.length || 0} Qs` : null,
          badgeColor: 'bg-amber-200 text-amber-900 border-amber-500',
        },
        {
          id: 'flashcards' as ActiveViewType,
          label: '3D Flashcards Deck',
          short: 'Flashcards',
          icon: Layers,
          symbol: '🃏',
          badge: isWorkspaceReady ? `${workspace.flashcards?.length || 0} cards` : null,
        },
        {
          id: 'cloze' as ActiveViewType,
          label: 'Fill-in-the-Blanks (Cloze)',
          short: 'Cloze Drill',
          icon: CheckSquare,
          symbol: '✏️',
          badge: null,
        },
      ],
    },
    {
      category: 'SCHEDULE & EXPORT',
      items: [
        {
          id: 'schedule' as ActiveViewType,
          label: '3-Day Study Schedule',
          short: 'Schedule',
          icon: Calendar,
          symbol: '🗓️',
          badge: `${scheduleDone}/3 done`,
          badgeColor: scheduleDone === 3 ? 'bg-emerald-300 text-emerald-950' : undefined,
        },
        {
          id: 'export' as ActiveViewType,
          label: 'Export & Cheat Sheet',
          short: 'Export',
          icon: Printer,
          symbol: '🖨️',
          badge: 'Print',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--card-bg)] border-r-[var(--border-thick)] select-none">
      {/* Brand Header */}
      <div className="p-4 border-b-[var(--border-thick)] flex items-center justify-between bg-[var(--brand-yellow)]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-studs font-black text-2xl text-[#111827] tracking-wider leading-none">
                STUDS
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#111827]/80">
                AI Student Workspace
              </span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center text-xl font-studs font-black">⚡</div>
        )}

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1 rounded border border-black bg-white hover:bg-rose-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-full border-[var(--border-thin)] bg-white hover:bg-slate-100 items-center justify-center font-black cursor-pointer shadow-[var(--shadow-sm)]"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {navCategories.map((group) => (
          <div key={group.category} className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-black tracking-wider uppercase text-[var(--text-muted)] px-2.5 py-1">
                {group.category}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] border-[var(--border-thin)] transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[var(--brand-blue)] text-white shadow-[var(--shadow-sm)] font-black translate-x-0.5'
                      : 'bg-[var(--card-bg-alt)] hover:bg-[var(--brand-yellow-light)] text-[var(--text-main)] font-extrabold hover:-translate-y-0.5'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={item.label}
                >
                  <span className="text-base shrink-0">{item.symbol}</span>
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="text-xs truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`ml-1.5 px-2 py-0.5 text-[10px] font-black rounded-full border border-black/30 shrink-0 ${
                            item.badgeColor ||
                            (isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--card-bg)] text-[var(--text-muted)]')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Status & Settings Dock */}
      <div className="p-3 border-t-[var(--border-thick)] bg-[var(--card-bg-alt)] space-y-2">
        {/* Streak Flame */}
        <div
          className={`flex items-center gap-2 p-2 rounded-[var(--radius-sm)] border-[var(--border-thin)] bg-[var(--brand-yellow)] font-black text-xs text-[#111827] ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Daily Study Streak"
        >
          <Flame className="w-4 h-4 text-orange-600 animate-bounce shrink-0" />
          {!isCollapsed && <span>{streak} Day Study Streak 🔥</span>}
        </div>


        {/* Theme Switcher in sidebar */}
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded-[var(--radius-sm)] border-[var(--border-thin)] bg-[var(--card-bg)] hover:bg-[var(--brand-yellow-light)] text-xs font-black cursor-pointer shadow-[var(--shadow-sm)]`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen transition-all duration-200 z-40 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
