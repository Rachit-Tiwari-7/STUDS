'use client';

import React, { useState } from 'react';
import { QuizQuestion, Flashcard, MissedTopic, DifficultyType } from '../lib/types';
import confetti from 'canvas-confetti';
import { HelpCircle, AlertTriangle, Check, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface ColumnRightProps {
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  difficulty: DifficultyType;
  onShowToast: (msg: string) => void;
}

export const ColumnRight: React.FC<ColumnRightProps> = ({
  quiz,
  flashcards,
  difficulty,
  onShowToast,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [missedTopics, setMissedTopics] = useState<MissedTopic[]>([]);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());

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
      onShowToast("🎉 PERFECT 100% SCORE! You've mastered this topic!");
    } else {
      onShowToast(`Quiz completed: ${score}/${quiz.length}! Review flagged weaknesses.`);
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
    onShowToast('Added card to Need Review pile! ⚠️');
    handleNextCard();
  };

  return (
    <aside className="flex flex-col gap-5 no-print">
      {/* 5-Question Quiz Card (Feature #4 & #12) */}
      <div className="comic-card p-5">
        <div className="corner-accent coral" />
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-base flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[var(--brand-blue)]" /> 5-Question Quiz
          </h3>
          <span className="badge-pill badge-pill-yellow text-[10px]">
            {difficulty.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {quiz.map((q, qIdx) => {
            const chosen = selectedAnswers[qIdx];

            return (
              <div
                key={qIdx}
                className="pb-3 border-b-[var(--border-thin)] last:border-none"
              >
                <div className="font-extrabold text-xs sm:text-sm mb-2">
                  {qIdx + 1}. {q.q}
                </div>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt, optIdx) => {
                    let labelClass = 'bg-[var(--card-bg-alt)] border-[var(--border-thin)]';

                    if (submitted) {
                      if (optIdx === q.correct) {
                        labelClass = 'bg-emerald-100 border-emerald-500 font-extrabold text-emerald-950';
                      } else if (chosen === optIdx) {
                        labelClass = 'bg-rose-100 border-rose-500 text-rose-950';
                      }
                    } else if (chosen === optIdx) {
                      labelClass = 'bg-[var(--brand-yellow-light)] border-[var(--card-border)] font-bold';
                    }

                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`flex items-center gap-2.5 p-2 rounded-[var(--radius-sm)] text-xs cursor-pointer transition-all ${labelClass}`}
                      >
                        <input
                          type="radio"
                          name={`quiz-${qIdx}`}
                          checked={chosen === optIdx}
                          onChange={() => handleSelectOption(qIdx, optIdx)}
                          className="accent-[var(--brand-blue)]"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-2 p-2 bg-[var(--brand-blue-light)] border-[var(--border-thin)] rounded-[var(--radius-sm)] text-[11px] font-semibold text-[var(--text-main)]">
                    💡 <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t-[var(--border-thin)]">
          {submitted ? (
            <button
              onClick={handleResetQuiz}
              className="btn-comic btn-comic-sm btn-comic-yellow"
            >
              Retake Quiz
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              className="btn-comic btn-comic-sm btn-comic-primary"
            >
              Submit Answers
            </button>
          )}

          {quizScore !== null && (
            <span className="font-black text-sm text-[var(--text-main)]">
              Score: {quizScore} / {quiz.length} ({Math.round((quizScore / quiz.length) * 100)}%)
            </span>
          )}
        </div>
      </div>

      {/* Targeted Weakness Analysis (Feature #7) */}
      {missedTopics.length > 0 && (
        <div className="comic-card p-4 bg-[var(--brand-coral-light)] border-[var(--brand-coral)]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-black text-xs sm:text-sm text-[var(--brand-coral)] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Priority Review Needed
            </h4>
            <span className="badge-pill badge-pill-coral text-[9px]">Missed in Quiz</span>
          </div>
          <p className="text-xs text-[var(--brand-coral)] mb-2">
            Focus on these areas to guarantee exam readiness:
          </p>
          <div className="flex flex-col gap-2">
            {missedTopics.map((m, idx) => (
              <div
                key={idx}
                className="bg-[var(--card-bg)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2 text-xs"
              >
                <strong className="block mb-1">{m.question}</strong>
                <span className="font-bold text-[var(--brand-coral-accent)] block mb-0.5">
                  Key Answer: {m.correctAnswer}
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">{m.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive 3D Flashcard Deck (Feature #23) */}
      <div className="comic-card p-4">
        <div className="corner-accent blue" />
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-base flex items-center gap-2">
            🃏 3D Flashcard Deck
          </h3>
          <span className="badge-pill badge-pill-blue text-[10px]">
            {flashcards.length > 0 ? `${cardIndex + 1} / ${flashcards.length}` : '0 / 0'}
          </span>
        </div>

        {/* 3D Flippable Card */}
        <div
          onClick={() => setIsCardFlipped(!isCardFlipped)}
          className="flashcard-wrapper"
        >
          <div className={`flashcard-inner ${isCardFlipped ? 'is-flipped' : ''}`}>
            {/* Front */}
            <div className="flashcard-front">
              <span className="badge-pill badge-pill-yellow text-[10px] mb-2">
                TERM / CONCEPT
              </span>
              <h4 className="font-black text-lg sm:text-xl text-center">
                {currentCard.front}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-2">
                (Click card to flip answer)
              </p>
            </div>

            {/* Back */}
            <div className="flashcard-back">
              <span className="badge-pill badge-pill-blue text-[10px] mb-2">
                DEFINITION & RECALL
              </span>
              <p className="text-xs sm:text-sm font-bold text-center leading-relaxed">
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>

        {/* Counters */}
        <div className="flex items-center justify-between text-xs font-bold mt-2.5 px-1">
          <span className="text-[var(--brand-green)]">
            ✅ Mastered: <strong>{masteredCards.size}</strong>
          </span>
          <span className="text-[var(--brand-coral-accent)]">
            ⚠️ Need Review: <strong>{reviewCards.size}</strong>
          </span>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={handleMarkReview}
            className="btn-comic btn-comic-sm btn-comic-coral"
            title="Need Review"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePrevCard}
            className="btn-comic btn-comic-sm"
            title="Previous Card"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextCard}
            className="btn-comic btn-comic-sm"
            title="Next Card"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMarkMastered}
            className="btn-comic btn-comic-sm btn-comic-yellow"
            title="Mastered!"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
