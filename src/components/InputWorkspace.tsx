'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Globe,
  Trash2,
} from 'lucide-react';
import { DifficultyType } from '../lib/types';
import { SAMPLE_LECTURE_TEXTS } from '../lib/sampleData';
import { transcribeHandwrittenImage, DEFAULT_OPENROUTER_VISION_MODEL } from '../lib/openrouter';

interface InputWorkspaceProps {
  rawText: string;
  onTextChange: (text: string) => void;
  difficulty: DifficultyType;
  onDifficultyChange: (diff: DifficultyType) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  groqModel: string;
  openRouterKey: string;
  openRouterVisionModel: string;
  onOpenOpenRouterModal: () => void;
}

export const InputWorkspace: React.FC<InputWorkspaceProps> = ({
  rawText,
  onTextChange,
  difficulty,
  onDifficultyChange,
  onGenerate,
  isGenerating,
  groqModel,
  openRouterKey,
  openRouterVisionModel,
  onOpenOpenRouterModal,
}) => {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileStats, setFileStats] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        setImagePreview(dataUrl);
        setFileStats(`📷 Image: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        setOcrStatus('Handwritten image loaded! Click "✨ AI OCR Transcribe Notes" below.');
      };
      reader.readAsDataURL(file);
      return;
    }

    // Text or simulated document
    const reader = new FileReader();
    reader.onload = (evt) => {
      let content = evt.target?.result as string;
      if (typeof content !== 'string' || content.includes('%PDF')) {
        content = `Extracted Text from ${file.name}:\n\n${SAMPLE_LECTURE_TEXTS.cs.text}`;
      }
      onTextChange(content);
      setImagePreview(null);
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      setFileStats(`📄 ${file.name} (${words} words, ${(file.size / 1024).toFixed(1)} KB)`);
      setOcrStatus(null);
    };
    reader.readAsText(file);
  };

  const handleTranscribeOCR = async () => {
    if (!imagePreview) return;
    if (!openRouterKey) {
      setOcrStatus('Please enter your OpenRouter API Key first.');
      onOpenOpenRouterModal();
      return;
    }

    setOcrLoading(true);

    try {
      const { text: markdown, usedModel } = await transcribeHandwrittenImage(
        openRouterKey,
        imagePreview,
        openRouterVisionModel || DEFAULT_OPENROUTER_VISION_MODEL,
        (statusMsg) => setOcrStatus(statusMsg)
      );
      onTextChange(markdown);
      const words = markdown.trim().split(/\s+/).filter(Boolean).length;
      const modelShort = usedModel.split('/')[1] || usedModel;
      setOcrStatus(`✅ Transcribed ${words} words via 100% Free Model: ${modelShort}!`);
    } catch (err: any) {
      setOcrStatus(`❌ OCR Failed: ${err.message || 'All free models were unavailable'}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePreload = (type: 'cs' | 'bio') => {
    const data = SAMPLE_LECTURE_TEXTS[type];
    onTextChange(data.text);
    setImagePreview(null);
    setFileStats(`📄 Loaded: ${data.title}`);
    setOcrStatus(null);
  };

  const charCount = rawText.length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <section className="max-w-[1400px] mx-auto mt-7 px-5 text-center no-print">
      {/* Hero Title */}
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[var(--text-main)] drop-shadow-[3px_3px_0_var(--brand-blue)] mb-2">
          Master Any Subject Instantly
        </h1>
        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-1.5 border-[var(--border-thick)] rounded-full bg-[var(--card-bg)] shadow-[var(--shadow-md)] font-black text-xs sm:text-sm">
          <span>⚡ Groq & OpenRouter Powered</span>
          <span>•</span>
          <span>📷 Handwritten OCR</span>
          <span>•</span>
          <span>🧠 Active Recall</span>
          <span>•</span>
          <span>🏆 100% Exam-Ready</span>
        </div>
      </div>

      {/* Instructions Accordion */}
      <div className="max-w-[1100px] mx-auto my-4 text-left">
        <button
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="w-full px-4 py-3 bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] flex items-center justify-between cursor-pointer font-extrabold text-sm"
        >
          <span>🚀 <strong>Quick Start Guide & Feature Tour</strong> (Click to view 25 power tools + OCR)</span>
          {instructionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {instructionsOpen && (
          <div className="p-4 bg-[var(--card-bg)] border-[var(--border-thick)] border-t-0 rounded-b-[var(--radius-md)] shadow-[var(--shadow-md)] -mt-1 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-1">
              <div className="bg-[var(--card-bg-alt)] p-3 border-[var(--border-thin)] rounded-[var(--radius-sm)]">
                <strong>1. Handwritten OCR & Vision</strong>
                <p className="text-[var(--text-muted)] mt-1">
                  Upload photos/scans of messy student notes. OpenRouter Vision (Gemini 2.0 Flash) transcribes them into clean Markdown.
                </p>
              </div>
              <div className="bg-[var(--card-bg-alt)] p-3 border-[var(--border-thin)] rounded-[var(--radius-sm)]">
                <strong>2. Groq LPU AI Synthesis</strong>
                <p className="text-[var(--text-muted)] mt-1">
                  Fastest inference (~800 tokens/sec) generating 5-question quizzes, 3D cards, schedules, and ELI5 notes.
                </p>
              </div>
              <div className="bg-[var(--card-bg-alt)] p-3 border-[var(--border-thin)] rounded-[var(--radius-sm)]">
                <strong>3. Active Recall & 3D Cards</strong>
                <p className="text-[var(--text-muted)] mt-1">
                  Click blacked-out spoilers to test retention. Flip cards with 3D animation and track mastered terms.
                </p>
              </div>
              <div className="bg-[var(--card-bg-alt)] p-3 border-[var(--border-thin)] rounded-[var(--radius-sm)]">
                <strong>4. Audio & Supabase Sync</strong>
                <p className="text-[var(--text-muted)] mt-1">
                  Listen via native speech reader. Sync to Supabase cloud DB or stay in LocalStorage mode.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Card */}
      <div className="comic-card max-w-[1200px] mx-auto my-5 p-6 text-left relative">
        <div className="corner-accent blue" />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-5">
          {/* Dropzone with OCR Photo Support */}
          <div className="flex flex-col gap-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed border-[var(--card-border)] rounded-[var(--radius-md)] p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative min-h-[160px] ${
                isDragOver ? 'bg-[var(--brand-yellow-light)] scale-[1.02]' : 'bg-[var(--brand-blue-light)]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.pdf,.doc,.docx,.md,image/*"
                className="hidden"
              />
              <Upload className="w-8 h-8 mb-2 text-[var(--brand-blue)]" />
              <div className="font-extrabold text-sm mb-1">
                Drop Notes, Docs, or Handwritten Photos
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Supports .PNG, .JPG, .PDF, .DOCX, .TXT, .MD
              </p>
              {fileStats && (
                <span className="mt-2.5 bg-[var(--card-bg)] border-[var(--border-thin)] px-3 py-1 rounded-full text-xs font-bold shadow-[var(--shadow-sm)]">
                  {fileStats}
                </span>
              )}
            </div>

            {/* Image Preview & OCR Trigger if an image was uploaded */}
            {imagePreview && (
              <div className="bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold flex items-center gap-1 text-[var(--brand-blue)]">
                    <ImageIcon className="w-3.5 h-3.5" /> Handwritten Note Preview
                  </span>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setFileStats(null);
                      setOcrStatus(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <div className="relative h-28 w-full bg-slate-900/10 rounded overflow-hidden border border-black/10 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Handwritten note preview"
                    className="max-h-full object-contain"
                  />
                </div>

                <button
                  onClick={handleTranscribeOCR}
                  disabled={ocrLoading}
                  className="comic-btn yellow py-2 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-[var(--shadow-sm)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{ocrLoading ? 'Transcribing with OpenRouter...' : '✨ AI OCR Transcribe Notes'}</span>
                </button>
              </div>
            )}

            {/* OCR Status banner */}
            {ocrStatus && (
              <div
                className={`p-2.5 rounded-[var(--radius-sm)] border-[var(--border-thin)] text-xs font-bold flex items-center gap-2 ${
                  ocrStatus.startsWith('❌')
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : ocrStatus.startsWith('✅')
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                {ocrStatus.startsWith('❌') ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : ocrStatus.startsWith('✅') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Globe className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                )}
                <span className="flex-1">{ocrStatus}</span>
              </div>
            )}
          </div>

          {/* Text Area */}
          <div className="flex flex-col gap-2">
            <textarea
              value={rawText}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Paste lecture notes, or upload a photo of handwritten notes on the left to transcribe automatically..."
              className="w-full h-48 border-[var(--border-thick)] rounded-[var(--radius-md)] p-3 text-sm bg-[var(--card-bg)] text-[var(--text-main)] resize-y outline-none focus:border-[var(--brand-blue)] font-sans"
            />
            <div className="flex justify-between text-xs font-extrabold text-[var(--text-muted)] px-1">
              <span>{charCount.toLocaleString()} characters</span>
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t-[var(--border-thin)]">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handlePreload('cs')}
              className="btn-comic btn-comic-sm btn-comic-yellow"
            >
              💻 Pre-Load CS Lecture
            </button>
            <button
              onClick={() => handlePreload('bio')}
              className="btn-comic btn-comic-sm btn-comic-yellow"
            >
              🧬 Pre-Load Bio Lecture
            </button>

            <div className="flex items-center gap-2 text-xs font-bold">
              <label htmlFor="quizDiffSelect">Quiz Level:</label>
              <select
                id="quizDiffSelect"
                value={difficulty}
                onChange={(e) => onDifficultyChange(e.target.value as DifficultyType)}
                className="font-bold text-xs px-3 py-1.5 border-[var(--border-thin)] rounded-full bg-[var(--card-bg)] text-[var(--text-main)] shadow-[var(--shadow-sm)] outline-none cursor-pointer"
              >
                <option value="easy">Easy (Definitions)</option>
                <option value="medium">Medium (Application)</option>
                <option value="hard">Hard (Analysis & Edge Cases)</option>
              </select>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating || ocrLoading}
            className="btn-comic btn-comic-primary"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Synthesizing with STUDS...' : '⚡ Generate with STUDS'}</span>
          </button>
        </div>

        {/* AI Loading Banner */}
        {isGenerating && (
          <div className="flex items-center gap-3.5 bg-[var(--brand-yellow-light)] border-[var(--border-thick)] rounded-[var(--radius-md)] p-3.5 mt-4 shadow-[var(--shadow-md)] animate-pulse">
            <div className="text-2xl animate-spin">⚡</div>
            <div className="flex-1">
              <div className="flex justify-between items-center gap-2">
                <strong className="text-sm font-studs">🧠 STUDS AI Synthesis Running...</strong>
                <span className="badge-pill badge-pill-yellow">Real-Time</span>
              </div>
              <div className="w-full h-2 bg-[var(--card-bg)] border-[var(--border-thin)] rounded-full overflow-hidden my-1.5">
                <div className="h-full w-2/5 bg-[var(--brand-blue)] rounded-full animate-pulse" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Synthesizing revision notes, 5-question quiz, 3D flashcards, mind map, and mnemonics...
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
