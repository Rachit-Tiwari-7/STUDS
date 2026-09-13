'use client';

import React, { useState } from 'react';
import {
  QuizQuestion,
  Flashcard,
  MissedTopic,
  DifficultyType,
  GlossaryTerm,
  Mnemonic,
  ScheduleDay,
} from '../lib/types';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  BookOpen,
  Calendar,
  Key,
  Search,
  Sparkles,
} from 'lucide-react';

interface ColumnRightProps {
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  difficulty: DifficultyType;
  onShowToast: (msg: string) => void;
  glossary?: GlossaryTerm[];
  mnemonics?: Mnemonic[];
  schedule?: ScheduleDay[];
  onToggleScheduleItem?: (index: number) => void;
}

export const ColumnRight: React.FC<ColumnRightProps> = ({
  quiz,
  flashcards,
  difficulty,
  onShowToast,
  glossary = [],
  mnemonics = [],
  schedule = [],
  onToggleScheduleItem,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'glossary' | 'schedule'>('flashcards');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [missedTopics, setMissedTopics] = useState<MissedTopic[]>([]);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());

  // Glossary search state
  const [glossarySearch, setGlossarySearch] = useState('');

  // Quiz methods
  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const handleSubmitQuiz = () => {
    if (quiz.length === 0) return;
    let score = 0;
    const missed: MissedTopic[] = [];

    quiz.forEach((q, idx) => {
      const chosen = selectedAnswers[idx];
      if (chosen === q.correct) {
        score++;
      } else {
        missed.push({
          question: q.q,
          correctAnswer: q.options[q.correct],
          tip: q.explanation,
        });
      }
    });

    setQuizScore(score);
    setMissedTopics(missed);
    setSubmitted(true);

    if (score === quiz.length) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      onShowToast("🎉 PERFECT 100%! You've mastered this topic!");
    } else {
      onShowToast(`Quiz scored: ${score}/${quiz.length}! Check review tips below.`);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setQuizScore(null);
    setMissedTopics([]);
  };

  // Flashcard methods
  const currentCard = flashcards[cardIndex] || {
    front: 'No flashcards available',
    back: 'Generate a workspace to populate flashcards.',
  };

  const handleNextCard = () => {
    setIsCardFlipped(false);
    setCardIndex((prev) => (prev + 1) % Math.max(1, flashcards.length));
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setCardIndex((prev) => (prev - 1 + flashcards.length) % Math.max(1, flashcards.length));
  };

  const handleMarkMastered = () => {
    setMasteredCards((prev) => {
      const next = new Set(prev);
      next.add(cardIndex);
      return next;
    });
    setReviewCards((prev) => {
      const next = new Set(prev);
      next.delete(cardIndex);
      return next;
    });
    onShowToast('Marked card as Mastered! 👍');
    handleNextCard();
  };

  const handleMarkReview = () => {
    setReviewCards((prev) => {
      const next = new Set(prev);
      next.add(cardIndex);
      return next;
    });
    setMasteredCards((prev) => {
      const next = new Set(prev);
      next.delete(cardIndex);
      return next;
    });
    onShowToast('Added card to Need Review! ⚠️');
    handleNextCard();
  };

  // Schedule calculation
  const totalSchedule = schedule.length;
  const completedSchedule = schedule.filter((s) => s.done).length;
  const schedulePct = totalSchedule > 0 ? Math.round((completedSchedule / totalSchedule) * 100) : 0;

  // Glossary filter
  const filteredGlossary = glossary.filter(
    (g) =>
      g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.def.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <aside className="flex flex-col gap-4 no-print sticky top-20">
      {/* Interactive Studio Rail Card */}
      <div className="comic-card p-4 shadow-[var(--shadow-md)]">
        {/* Rail Tab Navigation */}
        <div className="flex items-center justify-between border-b-[var(--border-thin)] pb-2 mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-sm)] font-black text-xs flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'bg-[var(--brand-yellow)] text-[#111827] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)]'
              }`}
              title="3D Flashcards Deck"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
              <span className="text-[10px] opacity-75">({flashcards.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-sm)] font-black text-xs flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-[var(--brand-yellow)] text-[#111827] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)]'
              }`}
              title="5-Question Assessment"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz</span>
              <span className="text-[10px] opacity-75">({quiz.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-sm)] font-black text-xs flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'glossary'
                  ? 'bg-[var(--brand-yellow)] text-[#111827] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)]'
              }`}
              title="Definitions & Mnemonics"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Terms</span>
              <span className="text-[10px] opacity-75">({glossary.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-sm)] font-black text-xs flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-[var(--brand-yellow)] text-[#111827] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)]'
              }`}
              title="3-Day Study Schedule"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Plan</span>
              <span className="text-[10px] opacity-75">({completedSchedule}/3)</span>
            </button>
          </div>

          <span className="badge-pill badge-pill-blue text-[9px] hidden xl:inline-flex uppercase">
            {difficulty}
          </span>
        </div>

        {/* TAB 1: 3D Flashcard Deck */}
        {activeTab === 'flashcards' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-[var(--text-main)]">
                Card {flashcards.length > 0 ? cardIndex + 1 : 0} of {flashcards.length}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-bold">
                Tap card to flip
              </span>
            </div>

            {/* 3D Flippable Card */}
            <div
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="flashcard-wrapper cursor-pointer"
            >
              <div className={`flashcard-inner ${isCardFlipped ? 'is-flipped' : ''}`}>
                {/* Front */}
                <div className="flashcard-front">
                  <span className="badge-pill badge-pill-yellow text-[9px] mb-2 font-black">
                    CONCEPT / TERM
                  </span>
                  <h4 className="font-extrabold text-base sm:text-lg text-center px-3 leading-snug">
                    {currentCard.front}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    (Click to reveal explanation)
                  </p>
                </div>

                {/* Back */}
                <div className="flashcard-back">
                  <span className="badge-pill badge-pill-blue text-[9px] mb-2 font-black">
                    RECALL & DEFINITION
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-center leading-relaxed px-2">
                    {currentCard.back}
                  </p>
                </div>
              </div>
            </div>

            {/* Counters */}
            <div className="flex items-center justify-between text-xs font-bold mt-3 px-1">
              <span className="text-emerald-600 dark:text-emerald-400">
                ✅ Mastered: <strong>{masteredCards.size}</strong>
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                ⚠️ Need Review: <strong>{reviewCards.size}</strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t-[var(--border-thin)]">
              <button
                onClick={handleMarkReview}
                className="btn-comic btn-comic-sm btn-comic-coral text-xs"
                title="Mark as Need Review"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Review</span>
              </button>
              <button
                onClick={handlePrevCard}
                className="btn-comic btn-comic-sm text-xs"
                title="Previous Card"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextCard}
                className="btn-comic btn-comic-sm text-xs"
                title="Next Card"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMarkMastered}
                className="btn-comic btn-comic-sm btn-comic-yellow text-xs"
                title="Mark as Mastered"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mastered</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: 5-Question Quiz */}
        {activeTab === 'quiz' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-xs text-[var(--text-main)]">
                5-Question Assessment
              </span>
              {quizScore !== null && (
                <span className="badge-pill badge-pill-yellow text-[10px] font-black">
                  Score: {quizScore} / {quiz.length}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-1">
              {quiz.map((q, qIdx) => {
                const chosen = selectedAnswers[qIdx];

                return (
                  <div
                    key={qIdx}
                    className="p-3 bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)]"
                  >
                    <div className="font-extrabold text-xs sm:text-sm mb-2 text-[var(--text-main)]">
                      {qIdx + 1}. {q.q}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {q.options.map((opt, optIdx) => {
                        let labelClass = 'bg-[var(--card-bg)] border-[var(--border-thin)]';

                        if (submitted) {
                          if (optIdx === q.correct) {
                            labelClass = 'bg-emerald-100 border-emerald-500 font-extrabold text-emerald-950 ring-1 ring-emerald-500';
                          } else if (chosen === optIdx) {
                            labelClass = 'bg-rose-100 border-rose-500 text-rose-950 ring-1 ring-rose-500';
                          }
                        } else if (chosen === optIdx) {
                          labelClass = 'bg-[var(--brand-yellow)] text-[#111827] font-extrabold shadow-[var(--shadow-sm)]';
                        }

                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer transition-all ${labelClass}`}
                          >
                            <input
                              type="radio"
                              name={`rail-quiz-${qIdx}`}
                              checked={chosen === optIdx}
                              onChange={() => handleSelectOption(qIdx, optIdx)}
                              className="accent-[var(--brand-blue)] shrink-0"
                            />
                            <span className="leading-tight">{opt}</span>
                          </label>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div className="mt-2 p-2 bg-[var(--brand-blue-light)]/40 border-[var(--border-thin)] rounded text-[11px] font-semibold text-[var(--text-main)]">
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between pt-2.5 border-t-[var(--border-thin)]">
              {submitted ? (
                <button
                  onClick={handleResetQuiz}
                  className="btn-comic btn-comic-sm btn-comic-yellow text-xs"
                >
                  Retake Quiz
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn-comic btn-comic-sm btn-comic-primary text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Answers</span>
                </button>
              )}

              {quizScore !== null && (
                <span className="font-extrabold text-xs text-[var(--text-main)]">
                  {Math.round((quizScore / Math.max(1, quiz.length)) * 100)}% Accuracy
                </span>
              )}
            </div>

            {/* Targeted Weakness Analysis */}
            {missedTopics.length > 0 && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-[var(--radius-sm)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Priority Review Needed</span>
                  </span>
                  <span className="badge-pill badge-pill-coral text-[9px]">
                    {missedTopics.length} Missed
                  </span>
                </div>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                  {missedTopics.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-[var(--card-bg)] p-2 rounded text-[11px] border border-rose-200 dark:border-rose-900"
                    >
                      <strong className="block text-[var(--text-main)]">{m.question}</strong>
                      <span className="text-rose-700 dark:text-rose-300 font-bold block mt-0.5">
                        Answer: {m.correctAnswer}
                      </span>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Glossary & Mnemonics */}
        {activeTab === 'glossary' && (
          <div>
            <div className="relative mb-2.5">
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Search key definitions..."
                className="w-full px-3 py-1.5 pl-8 text-xs border-[var(--border-thin)] rounded-full bg-[var(--card-bg)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)]"
              />
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
            </div>

            {/* Definitions List */}
            <div className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1 mb-3">
              {filteredGlossary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2.5 text-xs leading-relaxed"
                >
                  <strong className="block text-[var(--brand-blue)] font-extrabold mb-0.5">
                    {item.term}
                  </strong>
                  <p className="text-[var(--text-main)]">{item.def}</p>
                </div>
              ))}
              {filteredGlossary.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">
                  No matching definitions found.
                </p>
              )}
            </div>

            {/* Memory Mnemonics */}
            {mnemonics.length > 0 && (
              <div className="pt-2.5 border-t-[var(--border-thin)]">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 mb-2">
                  <Key className="w-3.5 h-3.5" />
                  <span>Memory Mnemonics</span>
                </div>
                <div className="flex flex-col gap-2">
                  {mnemonics.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-[var(--brand-yellow-light)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2 text-xs"
                    >
                      <div className="font-black text-[#111827] text-xs tracking-wider">
                        🔑 {m.word}
                      </div>
                      <p className="font-medium text-[#111827] mt-0.5 text-[11px]">{m.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 3-Day Study Schedule */}
        {activeTab === 'schedule' && (
          <div>
            <div className="flex items-center justify-between mb-2 pb-1 border-b-[var(--border-thin)]">
              <span className="font-black text-xs text-[var(--text-main)]">
                3-Day Micro Study Schedule
              </span>
              <span className="badge-pill badge-pill-green text-[9px]">
                {schedulePct}% Done
              </span>
            </div>

            <div className="flex flex-col gap-2.5 mb-3">
              {schedule.map((s, idx) => (
                <div
                  key={idx}
                  className="border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2.5 bg-[var(--card-bg-alt)]"
                >
                  <div className="flex items-center justify-between font-extrabold text-xs mb-1">
                    <span className="text-[var(--text-main)]">{s.day}</span>
                    <span className="badge-pill text-[9px]">Planned</span>
                  </div>
                  <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => onToggleScheduleItem && onToggleScheduleItem(idx)}
                      className="mt-0.5 accent-[var(--brand-blue)] cursor-pointer shrink-0"
                    />
                    <span
                      className={`leading-tight ${
                        s.done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'
                      }`}
                    >
                      {s.task}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t-[var(--border-thin)]">
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
        )}
      </div>
    </aside>
  );
};
