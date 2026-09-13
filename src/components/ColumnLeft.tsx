'use client';

import React, { useState } from 'react';
import { PersonaType, GlossaryTerm, Mnemonic, ScheduleDay, MindMapNode } from '../lib/types';
import { Folder, FileText, Search, Key, Calendar, GitBranch, Check, BookOpen } from 'lucide-react';

interface ColumnLeftProps {
  currentPersona: PersonaType;
  onPersonaChange: (persona: PersonaType) => void;
  glossary: GlossaryTerm[];
  mnemonics: Mnemonic[];
  schedule: ScheduleDay[];
  onToggleScheduleItem: (index: number) => void;
  mindmap: MindMapNode;
}

export const ColumnLeft: React.FC<ColumnLeftProps> = ({
  currentPersona,
  onPersonaChange,
  glossary,
  mnemonics,
  schedule,
  onToggleScheduleItem,
  mindmap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const filteredGlossary = glossary.filter(
    (g) =>
      g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.def.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSchedule = schedule.length;
  const completedSchedule = schedule.filter((s) => s.done).length;
  const schedulePct = totalSchedule > 0 ? Math.round((completedSchedule / totalSchedule) * 100) : 0;

  const toggleNode = (nodePath: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodePath]: !prev[nodePath],
    }));
  };

  const renderTreeNode = (node: MindMapNode, path: string = 'root'): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[path];

    return (
      <li key={path} className="relative mt-1.5 pl-3">
        {hasChildren ? (
          <div>
            <span
              onClick={() => toggleNode(path)}
              className="inline-flex items-center gap-1.5 font-bold text-xs cursor-pointer hover:text-[var(--brand-blue)] select-none"
            >
              <Folder className="w-3.5 h-3.5 text-[var(--brand-yellow-hover)] fill-[var(--brand-yellow)]" />
              <span>{node.title}</span>
            </span>
            {!isCollapsed && (
              <ul className="pl-3 relative border-l-2 border-[var(--card-border)] mt-1">
                {node.children!.map((child, idx) => renderTreeNode(child, `${path}-${idx}`))}
              </ul>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-main)]">
            <FileText className="w-3 h-3 text-[var(--text-muted)]" />
            <span>{node.title}</span>
          </span>
        )}
      </li>
    );
  };

  return (
    <aside className="flex flex-col gap-5 no-print">
      {/* Persona & Tone Switcher (Feature #5) */}
      <div className="comic-card p-4">
        <div className="corner-accent yellow" />
        <h3 className="font-black text-base flex items-center gap-2 mb-2 pb-1.5 border-b-[var(--border-thin)]">
          🎭 Persona & Tone
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-2.5">Select how the workspace explains concepts:</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'eli5', label: '👶 ELI5' },
              { id: 'professor', label: '🎓 Strict Prof' },
              { id: 'cram', label: '🚨 Exam Cram' },
              { id: 'tldr', label: '⚡ TL;DR' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => onPersonaChange(p.id)}
              className={`py-2 px-2.5 text-xs font-bold rounded-[var(--radius-sm)] border-[var(--border-thin)] transition-all cursor-pointer shadow-[var(--shadow-sm)] ${
                currentPersona === p.id
                  ? 'bg-[var(--brand-yellow)] border-[var(--border-thick)] -translate-x-0.5 -translate-y-0.5 shadow-[var(--shadow-md)] font-black'
                  : 'bg-[var(--card-bg-alt)] hover:bg-[var(--brand-yellow-light)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Definitions Glossary (Feature #6) */}
      <div className="comic-card p-4">
        <div className="corner-accent blue" />
        <h3 className="font-black text-base flex items-center gap-2 mb-2 pb-1.5 border-b-[var(--border-thin)]">
          <BookOpen className="w-4 h-4" /> Key Definitions
        </h3>
        <div className="relative mb-2.5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search key terms..."
            className="w-full px-3 py-1.5 text-xs border-[var(--border-thin)] rounded-full bg-[var(--card-bg)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)]"
          />
        </div>
        <div className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
          {filteredGlossary.map((item, idx) => (
            <div
              key={idx}
              className="bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2 text-xs"
            >
              <strong className="block text-[var(--brand-blue)] font-extrabold mb-0.5">
                {item.term}
              </strong>
              <p className="text-[var(--text-main)]">{item.def}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Memory Mnemonics (Feature #24) */}
      <div className="comic-card p-4">
        <div className="corner-accent coral" />
        <h3 className="font-black text-base flex items-center gap-2 mb-2 pb-1.5 border-b-[var(--border-thin)]">
          <Key className="w-4 h-4 text-amber-500" /> Memory Mnemonics
        </h3>
        <div className="flex flex-col gap-2">
          {mnemonics.map((m, idx) => (
            <div
              key={idx}
              className="bg-[var(--brand-yellow-light)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2.5 text-xs"
            >
              <div className="font-black text-[var(--brand-coral)] text-sm tracking-wider">
                🔑 {m.word}
              </div>
              <p className="font-semibold text-[var(--text-main)] mt-1">{m.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Day Micro Study Schedule (Feature #14) */}
      <div className="comic-card p-4">
        <div className="corner-accent green" />
        <h3 className="font-black text-base flex items-center gap-2 mb-2 pb-1.5 border-b-[var(--border-thin)]">
          <Calendar className="w-4 h-4 text-emerald-600" /> 3-Day Micro Schedule
        </h3>
        <div className="flex flex-col gap-2">
          {schedule.map((s, idx) => (
            <div
              key={idx}
              className="border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2 bg-[var(--card-bg-alt)]"
            >
              <div className="flex items-center justify-between font-extrabold text-xs mb-1">
                <span>{s.day}</span>
                <span className="badge-pill badge-pill-blue text-[10px]">Planned</span>
              </div>
              <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() => onToggleScheduleItem(idx)}
                  className="mt-0.5 accent-[var(--brand-blue)] cursor-pointer"
                />
                <span className={s.done ? 'line-through text-[var(--text-muted)]' : ''}>
                  {s.task}
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs font-black mb-1">
            <span>Prep Completion</span>
            <span>{schedulePct}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand-green)] transition-all duration-300"
              style={{ width: `${schedulePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mind-Map Outline Tree (Feature #11) */}
      <div className="comic-card p-4">
        <div className="corner-accent blue" />
        <h3 className="font-black text-base flex items-center gap-2 mb-2 pb-1.5 border-b-[var(--border-thin)]">
          <GitBranch className="w-4 h-4 text-[var(--brand-blue)]" /> Mind-Map Outline
        </h3>
        <ul className="text-xs list-none pl-1">
          {renderTreeNode(mindmap)}
        </ul>
      </div>
    </aside>
  );
};
