'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { InputWorkspace } from '@/components/InputWorkspace';
import { ColumnCenter } from '@/components/ColumnCenter';
import { ColumnRight } from '@/components/ColumnRight';
import { Sidebar } from '@/components/Sidebar';
import { FocusedViews } from '@/components/FocusedViews';
import { Upload } from 'lucide-react';
import {
  WorkspaceData,
  PersonaType,
  DifficultyType,
  ActiveViewType,
} from '@/lib/types';
import {
  getCSWorkspace,
  getBioWorkspace,
  getGenericWorkspace,
} from '@/lib/sampleData';
import { DEFAULT_GROQ_MODEL, resolveGroqModel } from '@/lib/groq';

export default function STUDSPage() {
  // Global App States
  const [isDark, setIsDark] = useState(false);
  const [streak, setStreak] = useState(1);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Structured View Navigation State
  const [activeView, setActiveView] = useState<ActiveViewType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Groq Model State (Server-backed)
  const [groqModel, setGroqModel] = useState(DEFAULT_GROQ_MODEL);
  const [isGenerating, setIsGenerating] = useState(false);

  // Workspace Inputs & Config
  const [rawText, setRawText] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyType>('medium');
  const [currentPersona, setCurrentPersona] = useState<PersonaType>('eli5');
  const [activeRecall, setActiveRecall] = useState(true);
  const [complexityLevel, setComplexityLevel] = useState(3);

  // Generated Workspace Data
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => getCSWorkspace());
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Initialization & LocalStorage Restore
  useEffect(() => {
    queueMicrotask(() => {
      // Theme
      const savedTheme = localStorage.getItem('studs_theme') || localStorage.getItem('studypulse_theme');
      if (savedTheme === 'dark') {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }

      // Streak
      const savedStreak = parseInt(localStorage.getItem('studs_streak') || localStorage.getItem('studypulse_streak') || '1', 10);
      const lastDate = localStorage.getItem('studs_last_date') || localStorage.getItem('studypulse_last_date');
      const today = new Date().toISOString().slice(0, 10);

      if (lastDate) {
        const last = new Date(lastDate);
        const curr = new Date(today);
        const diff = Math.floor((curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          setStreak(savedStreak + 1);
          localStorage.setItem('studs_streak', String(savedStreak + 1));
        } else if (diff === 0) {
          setStreak(savedStreak);
        } else {
          setStreak(1);
          localStorage.setItem('studs_streak', '1');
        }
      } else {
        setStreak(1);
        localStorage.setItem('studs_streak', '1');
      }
      localStorage.setItem('studs_last_date', today);

      // Groq model preference
      const rawModel =
        localStorage.getItem('studs_groq_model') ||
        localStorage.getItem('studypulse_groq_model') ||
        DEFAULT_GROQ_MODEL;
      setGroqModel(resolveGroqModel(rawModel));

      // Workspace restore
      const savedWorkspace = localStorage.getItem('studs_workspace') || localStorage.getItem('studypulse_workspace');
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          setWorkspace(parsed);
        } catch (e) {
          console.warn('Could not parse saved workspace', e);
        }
      }
    });
  }, []);

  // Handle Theme Toggle
  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('studs_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('studs_theme', 'light');
      }
      showToast(`Switched to ${next ? 'Dark' : 'Light'} Mode`);
      return next;
    });
  };

  // Handle Focus Mode Toggle
  const handleToggleFocus = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
      showToast(next ? 'Focus Mode Activated (Sidebars hidden)' : 'Exited Focus Mode');
      return next;
    });
  };

  // Keyboard shortcut for Focus Mode (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
        showToast('Exited Focus Mode');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, showToast]);

  // Secure Workspace Generation Orchestrator (Server-Side Route)
  const handleGenerateWorkspace = async (customText?: string) => {
    const text = (typeof customText === 'string' ? customText : rawText).trim();
    if (!text) {
      showToast('Please enter, upload, or pre-load lecture text first!');
      return;
    }

    const words = text.split(/\s+/).filter(Boolean).length;
    const readMin = Math.max(2, Math.round(words / 200) + 3);
    const studyTimeStr = `⏱️ ~${readMin} mins study time (${words} words)`;

    setIsGenerating(true);
    let nextWorkspace: WorkspaceData | null = null;

    try {
      // Call secure server route /api/synthesize (keys handled entirely in server env vars)
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureText: text,
          model: groqModel,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success && resJson.data) {
        nextWorkspace = resJson.data;
        showToast('🚀 AI Workspace Generated securely via server API!');
      } else {
        throw new Error(resJson.error || 'Server synthesis failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Backend synthesis error, activating local engine:', msg);
      showToast('Server busy — activated local offline generator.');

      const isBio = /cell|glycolysis|atp|respiration|mitochondri/i.test(text);
      const isCS = /process|thread|mutex|deadlock|semaphore|concurrency/i.test(text);

      if (isCS) {
        nextWorkspace = getCSWorkspace();
      } else if (isBio) {
        nextWorkspace = getBioWorkspace();
      } else {
        const firstLine = text.split('\n')[0].replace(/[:#]/g, '').slice(0, 60);
        nextWorkspace = getGenericWorkspace(text, firstLine);
      }
    } finally {
      setIsGenerating(false);
    }

    if (nextWorkspace) {
      nextWorkspace.studyTimeStr = studyTimeStr;
      setWorkspace(nextWorkspace);
      setIsWorkspaceReady(true);
      localStorage.setItem('studs_workspace', JSON.stringify(nextWorkspace));
    }

    // Scroll to dashboard
    const el = document.getElementById('dashboard-grid');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persona switch transformation
  const handlePersonaChange = (persona: PersonaType) => {
    setCurrentPersona(persona);

    setWorkspace((prev) => {
      const updatedSections = prev.sections.map((sec) => ({
        ...sec,
        bullets: sec.bullets.map((b) => {
          const clean = b.replace(/\[\[(.*?)\]\]/g, '$1');
          if (persona === 'eli5') {
            return `👶 <em>Like building blocks:</em> ${clean.replace(/deadlock/gi, 'traffic jam').replace(/process/gi, 'kitchen chef')}`;
          } else if (persona === 'professor') {
            return `🎓 <strong>Rigorous Principle:</strong> Note with precision that ${clean}. (Examinable concept!)`;
          } else if (persona === 'cram') {
            return `🚨 <strong>EXAM TRAP:</strong> ${clean} — Memorize this line for guaranteed points!`;
          } else {
            return `⚡ ${clean.slice(0, 90)}...`;
          }
        }),
      }));
      return { ...prev, sections: updatedSections };
    });

    showToast(`Switched tone to: ${persona.toUpperCase()}`);
  };

  // Schedule toggle
  const handleToggleScheduleItem = (idx: number) => {
    setWorkspace((prev) => {
      const newSchedule = [...prev.schedule];
      if (newSchedule[idx]) {
        newSchedule[idx] = { ...newSchedule[idx], done: !newSchedule[idx].done };
      }
      return { ...prev, schedule: newSchedule };
    });
  };

  // Export handlers
  const handleExportMarkdown = () => {
    let md = `# ${workspace.title}\n\n> ${workspace.studyTimeStr || ''}\n\n`;
    md += `## Key Takeaways\n`;
    workspace.takeaways.forEach((t) => { md += `- ${t}\n`; });
    md += `\n## Key Definitions\n`;
    workspace.glossary.forEach((g) => { md += `- **${g.term}**: ${g.def}\n`; });
    md += `\n## Revision Notes\n`;
    workspace.sections.forEach((s) => {
      md += `### ${s.title} (${s.complexity.toUpperCase()})\n`;
      s.bullets.forEach((b) => {
        md += `- ${b.replace(/\[\[(.*?)\]\]/g, '$1')}\n`;
      });
      md += `\n`;
    });
    md += `\n---\n*Generated by STUDS*\n`;

    navigator.clipboard.writeText(md).then(() => {
      showToast('Markdown copied to clipboard! 📋');
    });
  };

  const handleExportText = () => {
    let txt = `=== ${workspace.title} ===\n${workspace.studyTimeStr || ''}\n\n`;
    txt += `--- KEY TAKEAWAYS ---\n` + workspace.takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n') + `\n\n`;
    txt += `--- GLOSSARY ---\n` + workspace.glossary.map((g) => `* ${g.term}: ${g.def}`).join('\n') + `\n\n`;
    txt += `--- REVISION NOTES ---\n`;
    workspace.sections.forEach((s) => {
      txt += `[${s.complexity.toUpperCase()}] ${s.title}\n`;
      s.bullets.forEach((b) => {
        txt += `  • ${b.replace(/\[\[(.*?)\]\]/g, '$1')}\n`;
      });
      txt += `\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STUDS_${workspace.title.slice(0, 20).replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded .TXT summary file! 💾');
  };

  const handlePrint = () => {
    window.print();
  };

  const viewTitles: Record<ActiveViewType, string> = {
    dashboard: 'All-in-One Dashboard',
    notes: 'Revision Notes & Spoilers',
    flashcards: '3D Flashcards Deck',
    quiz: '5-Question Assessment',
    schedule: '3-Day Study Schedule',
    mindmap: 'Interactive Mind Map',
    glossary: 'Key Terms & Mnemonics',
    cloze: 'Fill-in-the-Blanks Drill',
    ocr: 'Handwritten Notes OCR',
    export: 'Export & Print Sheet',
  };

  return (
    <div className="min-h-screen flex flex-row font-sans bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Dedicated Left Navigation Sidebar */}
      {!isFocusMode && (
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          workspace={workspace}
          streak={streak}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          isWorkspaceReady={isWorkspaceReady}
        />
      )}

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header with active view indicator & mobile menu */}
        <Header
          streak={streak}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          isFocusMode={isFocusMode}
          onToggleFocus={handleToggleFocus}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          activeViewTitle={viewTitles[activeView]}
        />

        {/* Focus Mode Exit Floating Button */}
        {isFocusMode && (
          <button
            onClick={handleToggleFocus}
            className="fixed top-4 right-4 z-50 btn-comic btn-comic-yellow no-print"
          >
            ❌ Exit Focus Mode (Esc)
          </button>
        )}

        {/* Print View Header (Visible only when printing) */}
        <div className="print-only p-6 border-b-2 border-black">
          <h1 className="text-2xl font-black font-studs">{workspace.title}</h1>
          <p className="text-xs text-gray-600 font-bold">
            Generated with STUDS • Estimated Study Time: {workspace.studyTimeStr}
          </p>
        </div>

        {/* Active View Container */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {activeView === 'dashboard' ? (
            <>
              {/* Hero & Input Area */}
              {!isFocusMode && (
                <InputWorkspace
                  rawText={rawText}
                  onTextChange={setRawText}
                  difficulty={difficulty}
                  onDifficultyChange={setDifficulty}
                  onGenerate={handleGenerateWorkspace}
                  isGenerating={isGenerating}
                  groqModel={groqModel}
                  workspaceTitle={workspace.title}
                  isWorkspaceReady={isWorkspaceReady}
                />
              )}

              {/* 2-Column Executive Study Studio Layout (Only visible after 7-10s loader finishes!) */}
              {isWorkspaceReady ? (
                <main
                  id="dashboard-grid"
                  className={`max-w-[1520px] mx-auto mb-10 px-3 sm:px-5 grid gap-6 items-start transition-all ${
                    isFocusMode
                      ? 'grid-cols-1 max-w-[880px]'
                      : 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]'
                  }`}
                >
                  {/* Main Study Hub: Takeaways, Controls, Notes, Cloze, Mind Map, Export */}
                  <ColumnCenter
                    takeaways={workspace.takeaways}
                    sections={workspace.sections}
                    cloze={workspace.cloze}
                    studyTimeStr={workspace.studyTimeStr || '⏱️ ~5 mins study time'}
                    activeRecall={activeRecall}
                    onToggleActiveRecall={() => setActiveRecall(!activeRecall)}
                    complexityLevel={complexityLevel}
                    onComplexityChange={setComplexityLevel}
                    onExportMarkdown={handleExportMarkdown}
                    onExportText={handleExportText}
                    onPrint={handlePrint}
                    onShowToast={showToast}
                    currentPersona={currentPersona}
                    onPersonaChange={handlePersonaChange}
                    mindmap={workspace.mindmap}
                  />

                  {/* Interactive Companion Rail: Flashcards, Quiz, Glossary & Mnemonics, 3-Day Plan */}
                  {!isFocusMode && (
                    <ColumnRight
                      quiz={workspace.quiz}
                      flashcards={workspace.flashcards}
                      difficulty={difficulty}
                      onShowToast={showToast}
                      glossary={workspace.glossary}
                      mnemonics={workspace.mnemonics}
                      schedule={workspace.schedule}
                      onToggleScheduleItem={handleToggleScheduleItem}
                    />
                  )}
                </main>
              ) : (
                <div className="max-w-[1520px] mx-auto mb-10 px-3 sm:px-5">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const input = (document.getElementById('studs-file-upload') || document.querySelector('input[type="file"]')) as HTMLInputElement | null;
                        if (input) {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          input.files = dt.files;
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                      }
                    }}
                    className="border-3 border-dashed border-[var(--card-border)] rounded-[var(--radius-lg)] p-10 sm:p-16 text-center bg-[var(--card-bg)]/60 hover:bg-[var(--brand-yellow-light)]/20 transition-all flex flex-col items-center justify-center min-h-[380px] shadow-[var(--shadow-sm)]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[var(--brand-yellow)] border-[var(--border-thick)] flex items-center justify-center text-3xl mb-4 shadow-[var(--shadow-md)]">
                      📑
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] mb-2">
                      Workspace Ready — Awaiting Lecture Document
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6 leading-relaxed font-bold">
                      Upload your lecture PDF (such as your compiled LaTeX notes) or drop notes above to synthesize your 25-feature study cockpit.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const input = (document.getElementById('studs-file-upload') || document.querySelector('input[type="file"]')) as HTMLInputElement | null;
                        input?.click();
                      }}
                      className="btn-comic btn-comic-primary text-xs sm:text-sm flex items-center gap-2 px-6 py-3 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload PDF Document</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            isWorkspaceReady ? (
              <FocusedViews
                activeView={activeView}
                workspace={workspace}
                currentPersona={currentPersona}
                onPersonaChange={handlePersonaChange}
                activeRecall={activeRecall}
                onToggleActiveRecall={() => setActiveRecall(!activeRecall)}
                complexityLevel={complexityLevel}
                onComplexityChange={setComplexityLevel}
                onToggleScheduleItem={handleToggleScheduleItem}
                difficulty={difficulty}
                onExportMarkdown={handleExportMarkdown}
                onExportText={handleExportText}
                onPrint={handlePrint}
                onShowToast={showToast}
                onTextChange={setRawText}
                onGenerate={handleGenerateWorkspace}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="max-w-2xl mx-auto p-12 text-center comic-card bg-[var(--card-bg)] mt-8">
                <div className="text-4xl mb-3">📑</div>
                <h3 className="text-xl font-black mb-2">Study Material Not Yet Initialized</h3>
                <p className="text-xs text-[var(--text-muted)] font-bold mb-5">
                  Please return to the Dashboard and upload a lecture PDF or paste notes to generate this interactive study view.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="btn-comic btn-comic-primary text-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Comic Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none no-print">
          <div className="toast-pill show">
            <span>⚡</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
