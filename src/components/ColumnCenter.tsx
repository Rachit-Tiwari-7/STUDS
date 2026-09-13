'use client';

import React, { useState, useEffect } from 'react';
import { RevisionSection, ClozeExercise, PersonaType, MindMapNode } from '../lib/types';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Copy,
  Download,
  Printer,
  CheckCircle,
  BookOpen,
  Edit3,
  GitBranch,
  Folder,
  FileText,
} from 'lucide-react';

interface ColumnCenterProps {
  takeaways: string[];
  sections: RevisionSection[];
  cloze: ClozeExercise[];
  studyTimeStr: string;
  activeRecall: boolean;
  onToggleActiveRecall: () => void;
  complexityLevel: number;
  onComplexityChange: (level: number) => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onPrint: () => void;
  onShowToast: (msg: string) => void;
  currentPersona?: PersonaType;
  onPersonaChange?: (persona: PersonaType) => void;
  mindmap?: MindMapNode;
}

export const ColumnCenter: React.FC<ColumnCenterProps> = ({
  takeaways,
  sections,
  cloze,
  studyTimeStr,
  activeRecall,
  onToggleActiveRecall,
  complexityLevel,
  onComplexityChange,
  onExportMarkdown,
  onExportText,
  onPrint,
  onShowToast,
  currentPersona = 'eli5',
  onPersonaChange,
  mindmap,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'cloze' | 'mindmap'>('notes');
  const [complexityFilter, setComplexityFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [clozeInputs, setClozeInputs] = useState<Record<string, string>>({});
  const [clozeResults, setClozeResults] = useState<Record<string, boolean>>({});
  const [clozeScore, setClozeScore] = useState<string | null>(null);
  const [collapsedMindMapNodes, setCollapsedMindMapNodes] = useState<Record<string, boolean>>({});

  // Stop speech when unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpoiler = (key: string) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onShowToast('Speech synthesis not supported in this browser.');
      return;
    }

    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlayingAudio(true);
      } else {
        window.speechSynthesis.pause();
        setIsPlayingAudio(false);
      }
      return;
    }

    const textToRead = sections
      .map((s) => `${s.title}. ${s.bullets.map((b) => b.replace(/\[\[(.*?)\]\]/g, '$1')).join('. ')}`)
      .join('. ');

    if (!textToRead.trim()) {
      onShowToast('No notes available to read.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = audioSpeed;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    onShowToast('Playing revision notes via Speech Synthesis 🔊');
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleCheckCloze = () => {
    let correct = 0;
    let total = 0;
    const newResults: Record<string, boolean> = {};

    cloze.forEach((item, qIdx) => {
      item.answers.forEach((expected, bIdx) => {
        total++;
        const key = `${qIdx}-${bIdx}`;
        const actual = (clozeInputs[key] || '').toLowerCase().trim();
        const isRight =
          actual &&
          (actual === expected.toLowerCase().trim() ||
            (expected.toLowerCase().includes(actual) && actual.length > 3));
        newResults[key] = Boolean(isRight);
        if (isRight) correct++;
      });
    });

    setClozeResults(newResults);
    setClozeScore(`Score: ${correct} / ${total} Correct`);
    onShowToast(`Fill-in-the-blanks score: ${correct}/${total}!`);
  };

  const toggleMindMapNode = (nodePath: string) => {
    setCollapsedMindMapNodes((prev) => ({
      ...prev,
      [nodePath]: !prev[nodePath],
    }));
  };

  const renderTreeNode = (node: MindMapNode, path: string = 'root'): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedMindMapNodes[path];

    return (
      <li key={path} className="relative mt-2 pl-3">
        {hasChildren ? (
          <div>
            <span
              onClick={() => toggleMindMapNode(path)}
              className="inline-flex items-center gap-2 font-bold text-xs cursor-pointer hover:text-[var(--brand-blue)] select-none transition-colors"
            >
              <Folder className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>{node.title}</span>
            </span>
            {!isCollapsed && (
              <ul className="pl-4 relative border-l-2 border-slate-300 dark:border-slate-700 mt-1.5 space-y-1">
                {node.children!.map((child, idx) => renderTreeNode(child, `${path}-${idx}`))}
              </ul>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-main)] py-0.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{node.title}</span>
          </span>
        )}
      </li>
    );
  };

  const filteredSections = sections.filter(
    (s) => complexityFilter === 'all' || s.complexity === complexityFilter
  );

  const renderBulletWithSpoilers = (bullet: string, secIdx: number, bIdx: number) => {
    const parts = bullet.split(/(\[\[.*?\]\])/g);
    return (
      <span>
        {parts.map((part, pIdx) => {
          if (part.startsWith('[[') && part.endsWith(']]')) {
            const term = part.slice(2, -2);
            const key = `${secIdx}-${bIdx}-${pIdx}`;
            const isRevealed = revealedSpoilers[key];

            return (
              <span
                key={key}
                onClick={() => toggleSpoiler(key)}
                className={`spoiler-term ${isRevealed ? 'revealed' : ''}`}
                title="Click to reveal hidden concept"
              >
                {term}
              </span>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <section className={`flex flex-col gap-4 ${!activeRecall ? 'recall-off' : ''}`}>
      {/* High-Yield Key Takeaways Strip */}
      <div className="bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-md)] p-4 sm:p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between font-black text-sm sm:text-base mb-3 pb-2 border-b-[var(--border-thin)]">
          <div className="flex items-center gap-2 text-[var(--text-main)]">
            <span className="text-amber-500">⚡</span>
            <span>High-Yield Key Takeaways</span>
          </div>
          <span className="badge-pill badge-pill-yellow text-[10px]">
            {takeaways.length} Core Concepts
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {takeaways.map((t, idx) => (
            <div
              key={idx}
              className="bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-3 text-xs sm:text-sm leading-relaxed"
            >
              <strong className="block text-[var(--brand-blue)] font-extrabold mb-1">
                Takeaway #{idx + 1}
              </strong>
              <p className="text-[var(--text-main)] font-medium">{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Studio Control Toolbar */}
      <div className="bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-md)] p-3 sm:p-3.5 shadow-[var(--shadow-sm)] flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Left Controls: Audio & Tone */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Audio Player */}
          <div className="flex items-center gap-1 bg-[var(--card-bg-alt)] p-1 rounded-full border-[var(--border-thin)]">
            <button
              onClick={handleToggleAudio}
              className="btn-comic btn-comic-sm btn-comic-yellow text-xs px-2.5 py-1"
              title="Read notes aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={handleStopAudio}
              className="p-1 rounded-full hover:bg-[var(--card-bg)] text-xs font-bold px-2 cursor-pointer"
              title="Stop audio"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
            <select
              value={audioSpeed}
              onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
              className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-transparent outline-none cursor-pointer"
              title="Playback speed"
            >
              <option value="0.85">0.85x</option>
              <option value="1.0">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>

          {/* Persona / Tone Selector */}
          {onPersonaChange && (
            <div className="flex items-center gap-1 bg-[var(--card-bg-alt)] p-1 rounded-full border-[var(--border-thin)]">
              {(
                [
                  { id: 'eli5', label: '👶 ELI5' },
                  { id: 'professor', label: '🎓 Prof' },
                  { id: 'cram', label: '🚨 Cram' },
                  { id: 'tldr', label: '⚡ TL;DR' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPersonaChange(p.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                    currentPersona === p.id
                      ? 'bg-[var(--brand-yellow)] text-[#111827] shadow-[var(--shadow-sm)] font-black'
                      : 'hover:bg-[var(--card-bg)] text-[var(--text-muted)]'
                  }`}
                  title={`Switch explanation tone to ${p.label}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Active Recall & Complexity */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Active Recall Spoiler Toggle */}
          <button
            onClick={onToggleActiveRecall}
            className={`btn-comic btn-comic-sm text-xs ${
              activeRecall ? 'btn-comic-yellow' : 'bg-[var(--card-bg-alt)]'
            }`}
            title="Toggle blacked-out spoiler masks for active recall"
          >
            {activeRecall ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{activeRecall ? 'Recall: ON' : 'Recall: OFF'}</span>
          </button>

          {/* Complexity Slider */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold">
            <span className="text-[var(--text-muted)]">Level:</span>
            <input
              type="range"
              min="1"
              max="5"
              value={complexityLevel}
              onChange={(e) => onComplexityChange(parseInt(e.target.value, 10))}
              className="accent-[var(--brand-blue)] cursor-pointer w-20"
              title="Adjust concept depth"
            />
            <span className="badge-pill text-[10px]">
              {complexityLevel}/5
            </span>
          </div>

          <span className="badge-pill badge-pill-blue text-xs font-black">
            {studyTimeStr}
          </span>
        </div>
      </div>

      {/* Main Study Segment Navigation Bar */}
      <div className="bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-md)] p-2 shadow-[var(--shadow-sm)] flex items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[var(--brand-blue)] text-white shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Revision Notes</span>
            <span className="text-[10px] opacity-80">({sections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cloze')}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cloze'
                ? 'bg-[var(--brand-blue)] text-white shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Cloze Drills</span>
            <span className="text-[10px] opacity-80">({cloze.length})</span>
          </button>

          {mindmap && (
            <button
              onClick={() => setActiveTab('mindmap')}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'mindmap'
                  ? 'bg-[var(--brand-blue)] text-white shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Mind Map</span>
            </button>
          )}
        </div>

        {/* Complexity Heatmap Filters when on Notes */}
        {activeTab === 'notes' && (
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <button
              onClick={() => setComplexityFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                complexityFilter === 'all'
                  ? 'bg-[var(--card-bg-alt)] font-black border border-black/20'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setComplexityFilter('easy')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                complexityFilter === 'easy'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-500'
                  : 'text-emerald-700'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setComplexityFilter('medium')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                complexityFilter === 'medium'
                  ? 'bg-amber-100 text-amber-900 border border-amber-500'
                  : 'text-amber-700'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setComplexityFilter('hard')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                complexityFilter === 'hard'
                  ? 'bg-rose-100 text-rose-900 border border-rose-500'
                  : 'text-rose-700'
              }`}
            >
              Dense
            </button>
          </div>
        )}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'notes' && (
        <div className="flex flex-col gap-3.5">
          {filteredSections.map((sec, secIdx) => {
            const borderClass =
              sec.complexity === 'easy'
                ? 'border-l-4 border-l-[var(--brand-green)]'
                : sec.complexity === 'hard'
                ? 'border-l-4 border-l-[var(--brand-coral-accent)]'
                : 'border-l-4 border-l-[var(--brand-yellow)]';

            const badgeClass =
              sec.complexity === 'easy'
                ? 'badge-pill-green'
                : sec.complexity === 'hard'
                ? 'badge-pill-coral'
                : 'badge-pill-yellow';

            return (
              <div
                key={secIdx}
                className={`comic-card p-4 sm:p-5 ${borderClass} shadow-[var(--shadow-sm)]`}
              >
                <div className="flex items-center justify-between mb-3 pb-1 border-b-[var(--border-thin)]">
                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-main)]">
                    {sec.title}
                  </h3>
                  <span className={`badge-pill ${badgeClass} text-[10px]`}>
                    {sec.complexity.toUpperCase()}
                  </span>
                </div>
                <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 leading-relaxed text-[var(--text-main)]">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{renderBulletWithSpoilers(b, secIdx, bIdx)}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'cloze' && (
        <div className="comic-card p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-[var(--border-thin)]">
            <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
              <span>✏️</span>
              <span>Interactive Fill-in-the-Blanks (Cloze Test)</span>
            </h3>
            <span className="badge-pill badge-pill-yellow text-[10px]">
              Active Retrieval Drill
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Type the missing keywords in each blank to strengthen active recall:
          </p>

          <div className="flex flex-col gap-3.5">
            {cloze.map((item, qIdx) => {
              const parts = item.sentence.split(/\[blank\]/i);

              return (
                <div
                  key={qIdx}
                  className="bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-3 text-xs sm:text-sm leading-relaxed"
                >
                  {parts.map((part, pIdx) => {
                    const inputKey = `${qIdx}-${pIdx}`;
                    const isChecked = clozeResults[inputKey] !== undefined;
                    const isCorrect = clozeResults[inputKey];

                    return (
                      <React.Fragment key={pIdx}>
                        <span>{part}</span>
                        {pIdx < parts.length - 1 && (
                          <input
                            type="text"
                            value={clozeInputs[inputKey] || ''}
                            onChange={(e) =>
                              setClozeInputs((prev) => ({
                                ...prev,
                                [inputKey]: e.target.value,
                              }))
                            }
                            placeholder="type here..."
                            className={`mx-1.5 px-2 py-0.5 text-xs font-bold border rounded-md text-center outline-none w-32 transition-all ${
                              isChecked
                                ? isCorrect
                                  ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-extrabold ring-1 ring-emerald-500'
                                  : 'bg-rose-100 border-rose-500 text-rose-900 ring-1 ring-rose-500'
                                : 'bg-[var(--card-bg)] border-[var(--border-thin)]'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t-[var(--border-thin)]">
            <button
              onClick={handleCheckCloze}
              className="btn-comic btn-comic-sm btn-comic-yellow text-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Check Answers</span>
            </button>
            {clozeScore && (
              <span className="badge-pill badge-pill-blue text-xs font-black">
                {clozeScore}
              </span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mindmap' && mindmap && (
        <div className="comic-card p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-[var(--border-thin)]">
            <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[var(--brand-blue)]" />
              <span>Interactive Mind Map Outline</span>
            </h3>
            <span className="badge-pill text-[10px]">Tree Explorer</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Click any concept folder to expand or collapse sub-topics:
          </p>
          <ul className="text-xs list-none pl-1 space-y-1">
            {renderTreeNode(mindmap)}
          </ul>
        </div>
      )}

      {/* Multi-Format Export Bar */}
      <div className="flex flex-wrap items-center justify-end gap-2 mt-1 no-print">
        <button
          onClick={onExportMarkdown}
          className="btn-comic btn-comic-sm text-xs flex items-center gap-1.5"
          title="Copy markdown study summary to clipboard"
        >
          <Copy className="w-3 h-3" />
          <span>Copy Markdown</span>
        </button>
        <button
          onClick={onExportText}
          className="btn-comic btn-comic-sm text-xs flex items-center gap-1.5"
          title="Download text file summary"
        >
          <Download className="w-3 h-3" />
          <span>Download .TXT</span>
        </button>
        <button
          onClick={onPrint}
          className="btn-comic btn-comic-sm btn-comic-coral text-xs flex items-center gap-1.5"
          title="Print cheat sheet"
        >
          <Printer className="w-3 h-3" />
          <span>Print Cheat Sheet</span>
        </button>
      </div>
    </section>
  );
};
