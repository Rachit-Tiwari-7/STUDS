'use client';

import React, { useState } from 'react';
import {
  ActiveViewType,
  WorkspaceData,
  PersonaType,
  DifficultyType,
} from '../lib/types';
import {
  BookOpen,
  Calendar,
  GitBranch,
  Printer,
  Volume2,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  Copy,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FocusedViewsProps {
  activeView: ActiveViewType;
  workspace: WorkspaceData;
  currentPersona: PersonaType;
  onPersonaChange: (p: PersonaType) => void;
  activeRecall: boolean;
  onToggleActiveRecall: () => void;
  complexityLevel: number;
  onComplexityChange: (level: number) => void;
  onToggleScheduleItem: (idx: number) => void;
  difficulty: DifficultyType;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onPrint: () => void;
  onShowToast: (msg: string) => void;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const FocusedViews: React.FC<FocusedViewsProps> = ({
  activeView,
  workspace,
  currentPersona,
  onPersonaChange,
  activeRecall,
  onToggleActiveRecall,
  complexityLevel,
  onComplexityChange,
  onToggleScheduleItem,
  difficulty,
  onExportMarkdown,
  onExportText,
  onPrint,
  onShowToast,
  onTextChange,
}) => {
  // Flashcards state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<number[]>([]);
  const [reviewCards, setReviewCards] = useState<number[]>([]);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // Glossary search
  const [glossaryFilter, setGlossaryFilter] = useState('');

  // Cloze state
  const [clozeInputs, setClozeInputs] = useState<Record<number, string>>({});
  const [clozeResults, setClozeResults] = useState<Record<number, boolean>>({});

  // OCR state
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio playback handler
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onShowToast('Web Speech API not supported in this browser');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      onShowToast('Audio playback stopped');
      return;
    }
    const textToRead = [
      workspace.title,
      ...workspace.takeaways,
      ...workspace.sections.flatMap((s) => [s.title, ...s.bullets.map((b) => b.replace(/\[\[(.*?)\]\]/g, '$1'))]),
    ].join('. ');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    onShowToast('Playing audio revision notes 🎧');
  };

  // Flashcards handlers
  const cards = workspace.flashcards || [];
  const currentCard = cards[currentCardIdx] || { front: 'No cards available', back: 'Generate a workspace first' };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIdx((prev) => (prev + 1) % cards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIdx((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const markMastered = () => {
    if (!masteredCards.includes(currentCardIdx)) {
      setMasteredCards([...masteredCards, currentCardIdx]);
      setReviewCards(reviewCards.filter((c) => c !== currentCardIdx));
    }
    handleNextCard();
    onShowToast('Marked as Mastered! 🏆');
  };

  const markNeedReview = () => {
    if (!reviewCards.includes(currentCardIdx)) {
      setReviewCards([...reviewCards, currentCardIdx]);
      setMasteredCards(masteredCards.filter((c) => c !== currentCardIdx));
    }
    handleNextCard();
    onShowToast('Marked for Review 📝');
  };

  // Quiz submission
  const questions = workspace.quiz || [];
  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    if (quizSubmitted[qIdx]) return;
    setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx });
  };

  const handleSubmitQuizQuestion = (qIdx: number) => {
    if (quizAnswers[qIdx] === undefined) {
      onShowToast('Please pick an option first!');
      return;
    }
    setQuizSubmitted({ ...quizSubmitted, [qIdx]: true });
    const isCorrect = quizAnswers[qIdx] === questions[qIdx].correct;
    if (isCorrect) {
      onShowToast('Correct! Great job! 🎉');
      // Check if all answered correctly
      const nextSubmitted = { ...quizSubmitted, [qIdx]: true };
      if (Object.keys(nextSubmitted).length === questions.length) {
        const correctCount = questions.filter((q, idx) => quizAnswers[idx] === q.correct).length;
        if (correctCount === questions.length) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          onShowToast('100% PERFECT SCORE! Confetti! 🏆');
        }
      }
    } else {
      onShowToast('Incorrect — review the explanation below!');
    }
  };

  // OCR execution
  const handleOcrTranscribe = async () => {
    if (!ocrImage) return;
    setOcrLoading(true);
    setOcrStatus('Transcribing handwritten notes via server AI vision...');
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: ocrImage }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to transcribe notes');
      }
      onTextChange(data.text);
      const modelShort = (data.modelUsed || 'Vision AI').split('/')[1] || data.modelUsed;
      setOcrStatus(`✅ Transcribed via Free Vision AI: ${modelShort}!`);
      onShowToast('Handwritten notes transcribed into text area!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OCR transcription failure';
      setOcrStatus(`❌ OCR Failed: ${msg}`);
    } finally {
      setOcrLoading(false);
    }
  };

  // ============================================================================
  // RENDER PER ACTIVE VIEW
  // ============================================================================

  if (activeView === 'notes') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* View Header */}
        <div className="comic-card p-5 bg-[var(--card-bg)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-pill badge-pill-blue text-xs font-black">Feature #3, #5, #10, #22</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">{workspace.studyTimeStr}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">{workspace.title}</h2>
          </div>

          {/* Quick Audio & Active Recall toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSpeech}
              className={`btn-comic btn-comic-sm ${isSpeaking ? 'bg-rose-200' : 'btn-comic-yellow'}`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Notes'}</span>
            </button>
            <button
              onClick={onToggleActiveRecall}
              className={`btn-comic btn-comic-sm ${activeRecall ? 'bg-blue-100' : ''}`}
            >
              {activeRecall ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{activeRecall ? 'Hide Spoilers' : 'Show All'}</span>
            </button>
          </div>
        </div>

        {/* Top 3 High-Yield Takeaways Strip */}
        <div className="comic-card p-5 bg-[var(--brand-yellow)]">
          <div className="flex items-center justify-between mb-3 border-b-2 border-black/20 pb-2">
            <strong className="font-black text-sm flex items-center gap-2">
              <span>🚀</span> High-Yield Key Takeaways
            </strong>
            <span className="badge-pill bg-black text-white text-[10px] font-black">PRIORITY EXAM POINTS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {workspace.takeaways.map((t, idx) => (
              <div key={idx} className="bg-white p-3.5 rounded-[var(--radius-sm)] border-2 border-black shadow-[2px_2px_0_#000]">
                <strong className="text-xs font-black text-[var(--brand-blue)] block mb-1">Takeaway #{idx + 1}</strong>
                <p className="text-xs text-gray-800 font-bold leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Persona & Tone Switcher */}
        <div className="comic-card p-4 bg-[var(--card-bg)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <strong className="text-xs font-black uppercase">Persona & Tone:</strong>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'eli5', label: '👶 ELI5', desc: 'Simple building blocks' },
                  { id: 'professor', label: '🎓 Strict Prof', desc: 'Rigorous definitions' },
                  { id: 'cram', label: '🚨 Exam Cram', desc: 'High-yield shortcuts' },
                  { id: 'tldr', label: '⚡ TL;DR Bullets', desc: 'Ultra-concise summary' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPersonaChange(p.id)}
                  className={`px-3 py-1 text-xs font-black rounded-full border-[var(--border-thin)] cursor-pointer transition-transform ${
                    currentPersona === p.id
                      ? 'bg-[var(--brand-blue)] text-white shadow-[var(--shadow-sm)]'
                      : 'bg-[var(--card-bg-alt)] hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ELI5 Complexity Slider (1-5) */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-black uppercase flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> ELI5 Slider:
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={complexityLevel}
              onChange={(e) => onComplexityChange(parseInt(e.target.value, 10))}
              className="w-24 accent-[var(--brand-blue)] cursor-pointer"
            />
            <span className="badge-pill badge-pill-yellow text-[11px] font-black">Level {complexityLevel}</span>
          </div>
        </div>

        {/* Revision Notes Sections */}
        <div className="space-y-4">
          {workspace.sections.map((sec, sIdx) => {
            const badgeColor =
              sec.complexity === 'easy'
                ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                : sec.complexity === 'hard'
                ? 'bg-rose-100 border-rose-500 text-rose-900'
                : 'bg-amber-100 border-amber-500 text-amber-900';

            return (
              <div key={sIdx} className="comic-card p-5 bg-[var(--card-bg)] text-left">
                <div className="flex items-center justify-between mb-3 pb-2 border-b-[var(--border-thin)]">
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[var(--brand-blue)]" />
                    <span>{sec.title}</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeColor}`}>
                    {sec.complexity} Complexity
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm">
                  {sec.bullets.map((bullet, bIdx) => {
                    // Render active recall brackets [[ ]]
                    const parts = bullet.split(/(\[\[.*?\]\])/g);
                    return (
                      <li key={bIdx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[var(--brand-blue)] font-black text-sm mt-0.5">•</span>
                        <div className="flex-1">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('[[') && part.endsWith(']]')) {
                              const term = part.slice(2, -2);
                              if (activeRecall) {
                                return (
                                  <span
                                    key={pIdx}
                                    onClick={(e) => {
                                      e.currentTarget.classList.toggle('revealed');
                                    }}
                                    className="spoiler-term cursor-pointer inline-block"
                                    title="Click to reveal"
                                  >
                                    {term}
                                  </span>
                                );
                              }
                              return (
                                <strong key={pIdx} className="text-[var(--brand-blue)] font-black">
                                  {term}
                                </strong>
                              );
                            }
                            return <span key={pIdx} dangerouslySetInnerHTML={{ __html: part }} />;
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeView === 'flashcards') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-pill badge-pill-yellow text-xs font-black">Feature #23</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">3D Spaced Repetition</span>
            </div>
            <h2 className="text-2xl font-black">Interactive 3D Flashcard Deck</h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-black">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-500 text-emerald-800">
              🏆 {masteredCards.length} Mastered
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-500 text-rose-800">
              📝 {reviewCards.length} Review
            </span>
          </div>
        </div>

        {/* Big 3D Flippable Card Arena */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="flashcard-scene relative w-full h-80 sm:h-96 min-h-[320px] cursor-pointer select-none"
        >
          <div className={`flashcard-card relative w-full h-full ${isFlipped ? 'is-flipped' : ''}`}>
            {/* Front */}
            <div className="flashcard-face flashcard-front absolute inset-0 w-full h-full flex flex-col justify-between p-6 sm:p-8 bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="badge-pill badge-pill-blue text-xs font-black">CONCEPT QUESTION</span>
                <span className="text-xs font-black text-[var(--text-muted)]">
                  Card {currentCardIdx + 1} of {cards.length}
                </span>
              </div>

              <div className="my-auto text-center px-4">
                <h3 className="text-xl sm:text-3xl font-black leading-snug text-[var(--text-main)]">
                  {currentCard.front}
                </h3>
              </div>

              <div className="text-center text-xs font-black text-[var(--text-muted)]">
                🔄 Click card anywhere to reveal answer (3D Flip)
              </div>
            </div>

            {/* Back */}
            <div className="flashcard-face flashcard-back absolute inset-0 w-full h-full flex flex-col justify-between p-6 sm:p-8 bg-[var(--brand-yellow-light)] dark:bg-[#1a2333] border-[var(--border-thick)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="badge-pill badge-pill-yellow text-xs font-black">EXPLANATION / ANSWER</span>
                <span className="text-xs font-black text-[var(--text-muted)]">
                  Card {currentCardIdx + 1} of {cards.length}
                </span>
              </div>

              <div className="my-auto text-center px-4">
                <p className="text-base sm:text-xl font-bold text-amber-950 dark:text-amber-100 leading-relaxed">
                  {currentCard.back}
                </p>
              </div>

              <div className="text-center text-xs font-black text-[var(--brand-blue)] dark:text-amber-400">
                ✅ Flip again to review question
              </div>
            </div>
          </div>
        </div>

        {/* Card Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 comic-card bg-[var(--card-bg)]">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevCard} className="btn-comic btn-comic-sm">
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={handleNextCard} className="btn-comic btn-comic-sm">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markNeedReview}
              className="comic-btn py-2 px-3 text-xs font-black text-rose-700 bg-rose-100 hover:bg-rose-200 border-2 border-rose-600 rounded-[var(--radius-md)] cursor-pointer"
            >
              📝 Need Review
            </button>
            <button
              onClick={markMastered}
              className="comic-btn py-2 px-3 text-xs font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-600 rounded-[var(--radius-md)] cursor-pointer"
            >
              🏆 Mastered
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'quiz') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-pill badge-pill-yellow text-xs font-black">Feature #4, #7, #21</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">{questions.length} Questions</span>
            </div>
            <h2 className="text-2xl font-black">5-Question Assessment & Weakness Analysis</h2>
          </div>

          <span className="badge-pill badge-pill-blue text-xs font-black uppercase">
            Difficulty: {difficulty}
          </span>
        </div>

        {/* Quiz Questions List */}
        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const isSub = quizSubmitted[qIdx];
            const selectedOpt = quizAnswers[qIdx];
            const isCorrect = isSub && selectedOpt === q.correct;

            return (
              <div key={qIdx} className="comic-card p-5 bg-[var(--card-bg)] text-left">
                <div className="flex items-start justify-between gap-3 mb-3 pb-2 border-b-[var(--border-thin)]">
                  <h3 className="font-black text-base flex items-start gap-2">
                    <span className="text-[var(--brand-blue)]">{qIdx + 1}.</span>
                    <span>{q.q}</span>
                  </h3>
                  {isSub && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-500'
                          : 'bg-rose-100 text-rose-800 border-rose-500'
                      }`}
                    >
                      {isCorrect ? '✅ Correct' : '❌ Missed'}
                    </span>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2 mb-3">
                  {q.options.map((opt, optIdx) => {
                    const isPicked = selectedOpt === optIdx;
                    let optClass = 'bg-[var(--card-bg-alt)] hover:bg-slate-100 border-[var(--border-thin)]';

                    if (isSub) {
                      if (optIdx === q.correct) {
                        optClass = 'bg-emerald-100 border-emerald-600 font-black text-emerald-900';
                      } else if (isPicked && !isCorrect) {
                        optClass = 'bg-rose-100 border-rose-600 font-bold text-rose-900';
                      }
                    } else if (isPicked) {
                      optClass = 'bg-blue-100 border-[var(--brand-blue)] font-black text-[var(--brand-blue)]';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                        className={`p-3 rounded-[var(--radius-sm)] text-xs sm:text-sm cursor-pointer border flex items-center gap-3 transition-colors ${optClass}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-black text-xs shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Submit button & Explanation */}
                <div className="flex items-center justify-between pt-2 border-t-[var(--border-thin)]">
                  {!isSub ? (
                    <button
                      onClick={() => handleSubmitQuizQuestion(qIdx)}
                      className="btn-comic btn-comic-sm btn-comic-yellow"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <div className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-950 font-medium leading-relaxed">
                      <strong>💡 Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeView === 'schedule') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-pill badge-pill-yellow text-xs font-black">Feature #14</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">Spaced Repetition Schedule</span>
            </div>
            <h2 className="text-2xl font-black">3-Day Micro Study Planner</h2>
          </div>
        </div>

        <div className="space-y-4">
          {workspace.schedule.map((day, idx) => (
            <div
              key={idx}
              onClick={() => onToggleScheduleItem(idx)}
              className={`comic-card p-5 cursor-pointer transition-all ${
                day.done ? 'bg-emerald-50 border-emerald-500' : 'bg-[var(--card-bg)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <strong className="text-sm font-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--brand-blue)]" />
                  <span>{day.day}</span>
                </strong>
                <span
                  className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center font-black text-xs ${
                    day.done ? 'bg-emerald-500 text-white' : 'bg-white'
                  }`}
                >
                  {day.done ? '✓' : ''}
                </span>
              </div>
              <p className={`text-xs sm:text-sm font-medium ${day.done ? 'line-through text-gray-500' : ''}`}>
                {day.task}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'mindmap') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-pill badge-pill-yellow text-xs font-black">Feature #11</span>
            <span className="text-xs text-[var(--text-muted)] font-bold">Hierarchical Topic Tree</span>
          </div>
          <h2 className="text-2xl font-black">Interactive Mind-Map Outline</h2>
        </div>

        <div className="comic-card p-6 bg-[var(--card-bg)] text-left">
          <div className="font-black text-lg flex items-center gap-2 mb-4 pb-2 border-b-[var(--border-thin)] text-[var(--brand-blue)]">
            <GitBranch className="w-5 h-5" />
            <span>{workspace.mindmap?.title || workspace.title}</span>
          </div>

          <div className="space-y-4 pl-2">
            {workspace.mindmap?.children?.map((branch, bIdx) => (
              <div key={bIdx} className="border-l-3 border-[var(--brand-blue)] pl-4 py-1 space-y-2">
                <div className="font-black text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span>📂</span> {branch.title}
                </div>
                {branch.children && (
                  <div className="pl-4 space-y-1.5 border-l-2 border-dashed border-gray-300">
                    {branch.children.map((sub, sIdx) => (
                      <div key={sIdx} className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                        <span>📄</span> {sub.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'glossary') {
    const filtered = (workspace.glossary || []).filter(
      (g) =>
        g.term.toLowerCase().includes(glossaryFilter.toLowerCase()) ||
        g.def.toLowerCase().includes(glossaryFilter.toLowerCase())
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-pill badge-pill-yellow text-xs font-black">Feature #6, #24</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">{workspace.glossary.length} Terms</span>
            </div>
            <h2 className="text-2xl font-black">Key Definitions Glossary & Mnemonics</h2>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={glossaryFilter}
              onChange={(e) => setGlossaryFilter(e.target.value)}
              placeholder="🔍 Search definitions..."
              className="w-full px-3 py-1.5 text-xs border-[var(--border-thin)] rounded-full bg-[var(--card-bg-alt)] outline-none focus:border-[var(--brand-blue)]"
            />
          </div>
        </div>

        {/* Mnemonics box */}
        {workspace.mnemonics && workspace.mnemonics.length > 0 && (
          <div className="comic-card p-5 bg-amber-100 border-2 border-amber-500">
            <strong className="text-xs font-black uppercase text-amber-900 block mb-2">
              💡 Memory Aids & Mnemonics
            </strong>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspace.mnemonics.map((m, idx) => (
                <div key={idx} className="bg-white p-3 rounded border border-amber-400 text-xs">
                  <strong className="font-black text-amber-900 block">{m.word}</strong>
                  <span className="text-amber-800 font-medium">{m.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Glossary Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {filtered.map((item, idx) => (
            <div key={idx} className="comic-card p-4 bg-[var(--card-bg)]">
              <strong className="text-sm font-black text-[var(--brand-blue)] block mb-1">{item.term}</strong>
              <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">{item.def}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'cloze') {
    const clozeList = workspace.cloze || [];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-pill badge-pill-yellow text-xs font-black">Feature #17</span>
            <span className="text-xs text-[var(--text-muted)] font-bold">Cloze Deletion Drill</span>
          </div>
          <h2 className="text-2xl font-black">Interactive Fill-in-the-Blanks</h2>
        </div>

        <div className="space-y-4">
          {clozeList.map((exercise, idx) => {
            const isChecked = clozeResults[idx] !== undefined;
            const isCorrect = clozeResults[idx] === true;

            return (
              <div key={idx} className="comic-card p-5 bg-[var(--card-bg)] text-left space-y-3">
                <p className="text-sm sm:text-base font-bold leading-relaxed">{exercise.sentence}</p>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={clozeInputs[idx] || ''}
                    onChange={(e) => setClozeInputs({ ...clozeInputs, [idx]: e.target.value })}
                    placeholder="Type the missing word..."
                    className="px-3 py-1.5 text-xs sm:text-sm border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] outline-none flex-1"
                  />
                  <button
                    onClick={() => {
                      const input = (clozeInputs[idx] || '').trim().toLowerCase();
                      const match = exercise.answers.some((a) => a.toLowerCase() === input);
                      setClozeResults({ ...clozeResults, [idx]: match });
                      onShowToast(match ? 'Correct blank! 🎉' : 'Try again!');
                    }}
                    className="btn-comic btn-comic-sm btn-comic-yellow"
                  >
                    Check
                  </button>
                </div>

                {isChecked && (
                  <div className={`p-2 rounded text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {isCorrect ? '✅ Correct answer!' : `❌ Expected: ${exercise.answers.join(' or ')}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeView === 'ocr') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)] text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-pill badge-pill-yellow text-xs font-black">OpenRouter Vision</span>
            <span className="badge-pill bg-emerald-200 text-emerald-900 border-emerald-500 text-xs font-black">
              100% FREE MODELS ONLY
            </span>
          </div>
          <h2 className="text-2xl font-black">Handwritten Note Scanner & Free OCR</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Upload or drop photos of student handwriting. Our 3-model free fallback chain (Gemma 4 31B ➔ Gemma 4 26B ➔ OpenRouter/Free) transcribes notes directly into Markdown.
          </p>
        </div>

        {/* OCR Dropzone */}
        <div className="comic-card p-6 bg-[var(--card-bg)] text-center space-y-4">
          <label className="border-3 border-dashed border-black/30 rounded-[var(--radius-md)] p-8 flex flex-col items-center justify-center cursor-pointer bg-[var(--brand-blue-light)] hover:bg-[var(--brand-yellow-light)] transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setOcrImage(evt.target?.result as string);
                    setOcrStatus('Handwritten image loaded! Click "Transcribe Notes" below.');
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Upload className="w-10 h-10 mb-2 text-[var(--brand-blue)]" />
            <strong className="text-sm font-black">Click or Drop Photo of Handwritten Notes</strong>
            <span className="text-xs text-[var(--text-muted)]">Supports JPG, PNG, WEBP scans</span>
          </label>

          {ocrImage && (
            <div className="p-3 bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] flex flex-col items-center gap-3">
              <div className="h-44 max-w-sm overflow-hidden rounded border border-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ocrImage} alt="Handwritten note" className="h-full w-full object-contain" />
              </div>
              <button
                onClick={handleOcrTranscribe}
                disabled={ocrLoading}
                className="btn-comic btn-comic-primary w-full max-w-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{ocrLoading ? 'Transcribing with Free Vision...' : '✨ AI OCR Transcribe Notes'}</span>
              </button>
            </div>
          )}

          {ocrStatus && (
            <div className="p-3 rounded border-[var(--border-thin)] text-xs font-bold bg-amber-50 text-amber-900 border-amber-300">
              {ocrStatus}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'export') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="comic-card p-5 bg-[var(--card-bg)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-pill badge-pill-yellow text-xs font-black">Feature #8, #19</span>
            <span className="text-xs text-[var(--text-muted)] font-bold">Multi-Format Study Kit</span>
          </div>
          <h2 className="text-2xl font-black">Export Notes & Print Cheat Sheet</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="comic-card p-5 bg-[var(--card-bg)] text-center flex flex-col justify-between">
            <div>
              <div className="text-3xl mb-2">📋</div>
              <strong className="text-sm font-black block mb-1">Copy Markdown</strong>
              <p className="text-xs text-[var(--text-muted)]">Copy clean formatted Markdown with headers & terms to clipboard.</p>
            </div>
            <button onClick={onExportMarkdown} className="btn-comic btn-comic-sm btn-comic-yellow mt-4">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>

          <div className="comic-card p-5 bg-[var(--card-bg)] text-center flex flex-col justify-between">
            <div>
              <div className="text-3xl mb-2">💾</div>
              <strong className="text-sm font-black block mb-1">Download .TXT</strong>
              <p className="text-xs text-[var(--text-muted)]">Save raw study notes to offline file on your device.</p>
            </div>
            <button onClick={onExportText} className="btn-comic btn-comic-sm btn-comic-yellow mt-4">
              <Download className="w-4 h-4" /> Download
            </button>
          </div>

          <div className="comic-card p-5 bg-[var(--card-bg)] text-center flex flex-col justify-between">
            <div>
              <div className="text-3xl mb-2">🖨️</div>
              <strong className="text-sm font-black block mb-1">Print Cheat Sheet</strong>
              <p className="text-xs text-[var(--text-muted)]">Open clean high-density print stylesheet for offline exam review.</p>
            </div>
            <button onClick={onPrint} className="btn-comic btn-comic-sm btn-comic-primary mt-4">
              <Printer className="w-4 h-4" /> Print Sheet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
