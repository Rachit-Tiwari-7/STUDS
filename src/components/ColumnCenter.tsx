'use client';

import React, { useState, useEffect } from 'react';
import { RevisionSection, ClozeExercise } from '../lib/types';
import { Volume2, VolumeX, Eye, EyeOff, Copy, Download, Printer, CheckCircle } from 'lucide-react';

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
}) => {
  const [complexityFilter, setComplexityFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [clozeInputs, setClozeInputs] = useState<Record<string, string>>({});
  const [clozeResults, setClozeResults] = useState<Record<string, boolean>>({});
  const [clozeScore, setClozeScore] = useState<string | null>(null);

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
    onShowToast('Reading notes with native Speech Synthesis! 🔊');
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
        const isRight = actual && (actual === expected.toLowerCase().trim() || expected.toLowerCase().includes(actual) && actual.length > 3);
        newResults[key] = Boolean(isRight);
        if (isRight) correct++;
      });
    });

    setClozeResults(newResults);
    setClozeScore(`Score: ${correct} / ${total} Correct`);
    onShowToast(`Fill-in-the-blanks: ${correct}/${total} correct!`);
  };

  const filteredSections = sections.filter(
    (s) => complexityFilter === 'all' || s.complexity === complexityFilter
  );

  const complexityLabels = [
    'Lv 1: Toddler/Toys',
    'Lv 2: Middle School',
    'Lv 3: College Undergrad',
    'Lv 4: Graduate Seminar',
    'Lv 5: PhD Specialist',
  ];

  const renderBulletWithSpoilers = (bullet: string, secIdx: number, bIdx: number) => {
    // Replace [[Term]] with interactive spoiler spans
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
                title="Click to reveal term"
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
    <section className={`flex flex-col gap-5 ${!activeRecall ? 'recall-off' : ''}`}>
      {/* Key Takeaways Highlight Strip (Feature #16) */}
      <div className="bg-[var(--brand-yellow)] border-[var(--border-thick)] rounded-[var(--radius-md)] p-4 sm:p-5 shadow-[var(--shadow-md)]">
        <div className="flex items-center justify-between font-black text-base sm:text-lg mb-3">
          <div className="flex items-center gap-2">
            <span>🚀 High-Yield Key Takeaways</span>
          </div>
          <span className="badge-pill badge-pill-coral text-[10px]">Priority Exam Points</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {takeaways.map((t, idx) => (
            <div
              key={idx}
              className="bg-[var(--card-bg)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-3 text-xs sm:text-sm font-semibold shadow-[var(--shadow-sm)]"
            >
              <strong className="block text-[var(--brand-coral)] font-extrabold mb-1">
                ⚡ Takeaway #{idx + 1}
              </strong>
              <p>{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Note Center Tool Bar (Audio, ELI5, Active Recall, Study Time) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] no-print">
        {/* Audio Player Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAudio}
            className="btn-comic btn-comic-sm btn-comic-yellow"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isPlayingAudio ? 'Pause' : 'Play Notes'}</span>
          </button>
          <button
            onClick={handleStopAudio}
            className="btn-comic btn-comic-sm"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
          <select
            value={audioSpeed}
            onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
            className="text-xs font-bold px-2 py-1 rounded-full border-[var(--border-thin)] bg-[var(--card-bg-alt)] outline-none cursor-pointer"
          >
            <option value="0.85">0.85x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
          </select>
        </div>

        {/* ELI5 Complexity Slider */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span>Complexity:</span>
          <input
            type="range"
            min="1"
            max="5"
            value={complexityLevel}
            onChange={(e) => onComplexityChange(parseInt(e.target.value, 10))}
            className="accent-[var(--brand-blue)] cursor-pointer w-24 sm:w-28"
          />
          <span className="badge-pill badge-pill-yellow text-[10px]">
            {complexityLabels[complexityLevel - 1]}
          </span>
        </div>

        {/* Active Recall Toggle */}
        <button
          onClick={onToggleActiveRecall}
          className={`btn-comic btn-comic-sm ${!activeRecall ? 'btn-comic-yellow' : ''}`}
        >
          {activeRecall ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{activeRecall ? 'Recall: ON' : 'Recall: OFF'}</span>
        </button>

        {/* Study Time Badge */}
        <span className="badge-pill badge-pill-blue text-xs font-black">
          {studyTimeStr}
        </span>
      </div>

      {/* Complexity Heatmap Filters */}
      <div className="flex items-center justify-between text-xs font-bold px-1 no-print">
        <span>Content Complexity Heatmap:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setComplexityFilter('all')}
            className={`badge-pill cursor-pointer ${complexityFilter === 'all' ? 'badge-pill-blue' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setComplexityFilter('easy')}
            className={`badge-pill badge-pill-green cursor-pointer ${complexityFilter === 'easy' ? 'ring-2 ring-black' : ''}`}
          >
            🟢 Easy
          </button>
          <button
            onClick={() => setComplexityFilter('medium')}
            className={`badge-pill badge-pill-yellow cursor-pointer ${complexityFilter === 'medium' ? 'ring-2 ring-black' : ''}`}
          >
            🟡 Medium
          </button>
          <button
            onClick={() => setComplexityFilter('hard')}
            className={`badge-pill badge-pill-coral cursor-pointer ${complexityFilter === 'hard' ? 'ring-2 ring-black' : ''}`}
          >
            🔴 Dense/Hard
          </button>
        </div>
      </div>

      {/* Revision Notes Section Cards */}
      <div className="flex flex-col gap-4">
        {filteredSections.map((sec, secIdx) => {
          const borderClass =
            sec.complexity === 'easy'
              ? 'border-l-8 border-l-[var(--brand-green)]'
              : sec.complexity === 'hard'
              ? 'border-l-8 border-l-[var(--brand-coral-accent)]'
              : 'border-l-8 border-l-[var(--brand-yellow)]';

          const badgeClass =
            sec.complexity === 'easy'
              ? 'badge-pill-green'
              : sec.complexity === 'hard'
              ? 'badge-pill-coral'
              : 'badge-pill-yellow';

          return (
            <div
              key={secIdx}
              className={`comic-card p-5 ${borderClass}`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-extrabold text-base">{sec.title}</h3>
                <span className={`badge-pill ${badgeClass} text-[10px]`}>
                  {sec.complexity.toUpperCase()}
                </span>
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1.5 leading-relaxed">
                {sec.bullets.map((b, bIdx) => (
                  <li key={bIdx}>{renderBulletWithSpoilers(b, secIdx, bIdx)}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Interactive Cloze / Fill-in-the-Blanks (Feature #17) */}
      <div className="comic-card p-5 no-print">
        <div className="corner-accent green" />
        <h3 className="font-black text-base flex items-center gap-2 mb-2 pb-1.5 border-b-[var(--border-thin)]">
          ✏️ Interactive Fill-in-the-Blanks (Cloze Test)
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Type the missing keywords to test active retrieval:
        </p>

        <div className="flex flex-col gap-3">
          {cloze.map((item, qIdx) => {
            const parts = item.sentence.split(/\[blank\]/i);

            return (
              <div key={qIdx} className="text-xs sm:text-sm leading-relaxed">
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
                          className={`mx-1.5 px-2 py-0.5 text-xs font-bold border rounded text-center outline-none w-32 ${
                            isChecked
                              ? isCorrect
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                                : 'bg-rose-100 border-rose-500 text-rose-900'
                              : 'bg-[var(--card-bg-alt)] border-[var(--border-thin)]'
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
            className="btn-comic btn-comic-sm btn-comic-yellow"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Check Blanks</span>
          </button>
          {clozeScore && (
            <span className="badge-pill badge-pill-blue text-xs font-black">
              {clozeScore}
            </span>
          )}
        </div>
      </div>

      {/* Multi-Format Export Bar (Feature #8 & #19) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 mt-2 no-print">
        <button
          onClick={onExportMarkdown}
          className="btn-comic btn-comic-sm"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Markdown</span>
        </button>
        <button
          onClick={onExportText}
          className="btn-comic btn-comic-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download .TXT</span>
        </button>
        <button
          onClick={onPrint}
          className="btn-comic btn-comic-sm btn-comic-coral"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Cheat Sheet</span>
        </button>
      </div>
    </section>
  );
};
