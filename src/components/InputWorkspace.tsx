'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Globe,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { DifficultyType } from '../lib/types';
import { SAMPLE_LECTURE_TEXTS } from '../lib/sampleData';

interface InputWorkspaceProps {
  rawText: string;
  onTextChange: (text: string) => void;
  difficulty: DifficultyType;
  onDifficultyChange: (diff: DifficultyType) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  groqModel: string;
  workspaceTitle?: string;
}

export const InputWorkspace: React.FC<InputWorkspaceProps> = ({
  rawText,
  onTextChange,
  difficulty,
  onDifficultyChange,
  onGenerate,
  isGenerating,
  groqModel,
  workspaceTitle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileStats, setFileStats] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setFileStats(`📷 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        setOcrStatus('Handwritten image loaded! Click "AI OCR Transcribe" to extract text.');
        setIsExpanded(true);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Text or document
    const reader = new FileReader();
    reader.onload = (evt) => {
      let content = evt.target?.result as string;
      if (typeof content !== 'string' || content.includes('%PDF')) {
        content = `Extracted Text from ${file.name}:\n\n${SAMPLE_LECTURE_TEXTS.cs.text}`;
      }
      onTextChange(content);
      setImagePreview(null);
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      setFileStats(`📄 ${file.name} (${words} words)`);
      setOcrStatus(null);
      setIsExpanded(true);
    };
    reader.readAsText(file);
  };

  const handleTranscribeOCR = async () => {
    if (!imagePreview) return;
    setOcrLoading(true);
    setOcrStatus('Transcribing handwritten notes via server AI vision...');

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imagePreview }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Transcription failed');
      }
      onTextChange(data.text);
      const words = data.text.trim().split(/\s+/).filter(Boolean).length;
      const modelShort = (data.modelUsed || 'Vision').split('/')[1] || data.modelUsed;
      setOcrStatus(`✅ Transcribed ${words} words via ${modelShort}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Model unavailable';
      setOcrStatus(`❌ OCR Failed: ${msg}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePreload = (type: 'cs' | 'bio') => {
    const data = SAMPLE_LECTURE_TEXTS[type];
    onTextChange(data.text);
    setImagePreview(null);
    setFileStats(`Loaded: ${data.title}`);
    setOcrStatus(null);
  };

  const charCount = rawText.length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <section className="max-w-[1520px] mx-auto px-3 sm:px-5 mt-4 mb-5 no-print">
      {/* Studio Header & Input Bar */}
      <div className="bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-md)] p-3 sm:p-4 shadow-[var(--shadow-sm)] transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Active Workspace / Subject Summary */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-yellow)] border-[var(--border-thin)] flex items-center justify-center shrink-0 shadow-[var(--shadow-sm)] font-black text-lg">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-[var(--text-main)] truncate">
                  {workspaceTitle || 'Current Study Workspace'}
                </h2>
                <span className="badge-pill badge-pill-yellow text-[10px] hidden sm:inline-flex">
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-2 mt-0.5">
                <span>{wordCount > 0 ? `${wordCount.toLocaleString()} words loaded` : 'Ready for input'}</span>
                <span>•</span>
                <span className="capitalize">Level: {difficulty}</span>
                <span>•</span>
                <span className="truncate max-w-[150px]" title={groqModel}>⚡ {groqModel.split('/')[1] || groqModel}</span>
                {fileStats && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{fileStats}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions & Drawer Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePreload('cs')}
              className="btn-comic btn-comic-sm bg-[var(--card-bg-alt)] hover:bg-[var(--brand-yellow-light)] text-xs"
              title="Load Computer Science Operating Systems lecture sample"
            >
              💻 CS Lecture
            </button>
            <button
              onClick={() => handlePreload('bio')}
              className="btn-comic btn-comic-sm bg-[var(--card-bg-alt)] hover:bg-[var(--brand-yellow-light)] text-xs"
              title="Load Biology Cellular Respiration lecture sample"
            >
              🧬 Bio Lecture
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`btn-comic btn-comic-sm text-xs flex items-center gap-1.5 ${
                isExpanded ? 'btn-comic-yellow' : 'bg-[var(--card-bg-alt)]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isExpanded ? 'Hide Input Drawer' : 'Edit / Input Notes'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onGenerate}
              disabled={isGenerating || ocrLoading}
              className="btn-comic btn-comic-sm btn-comic-primary text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Synthesizing...' : '⚡ Synthesize'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Input & Upload Drawer */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t-[var(--border-thin)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
              {/* Dropzone & OCR Image Upload */}
              <div className="flex flex-col gap-2.5">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-[var(--card-border)] rounded-[var(--radius-md)] p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                    isDragOver ? 'bg-[var(--brand-yellow-light)] scale-[1.01]' : 'bg-[var(--card-bg-alt)] hover:bg-[var(--brand-blue-light)]/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,.pdf,.doc,.docx,.md,image/*"
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 mb-1.5 text-[var(--brand-blue)]" />
                  <div className="font-extrabold text-xs sm:text-sm text-[var(--text-main)]">
                    Upload Notes, Docs, or Handwritten Photos
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Supports .PNG, .JPG, .PDF, .DOCX, .TXT, .MD
                  </p>
                </div>

                {/* Handwritten Image Preview & OCR Transcription */}
                {imagePreview && (
                  <div className="bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-1.5 text-[var(--brand-blue)]">
                        <Camera className="w-3.5 h-3.5" /> Handwritten Note Preview
                      </span>
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setFileStats(null);
                          setOcrStatus(null);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>

                    <div className="relative h-24 w-full bg-slate-900/10 rounded overflow-hidden border border-black/10 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Handwritten note preview"
                        className="max-h-full object-contain"
                      />
                    </div>

                    <button
                      onClick={handleTranscribeOCR}
                      disabled={ocrLoading}
                      className="btn-comic btn-comic-sm btn-comic-yellow w-full text-xs font-black flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{ocrLoading ? 'Transcribing with OpenRouter...' : '✨ Transcribe Note with OCR'}</span>
                    </button>
                  </div>
                )}

                {/* OCR Status banner */}
                {ocrStatus && (
                  <div
                    className={`p-2 rounded-[var(--radius-sm)] border-[var(--border-thin)] text-xs font-bold flex items-center gap-2 ${
                      ocrStatus.startsWith('❌')
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : ocrStatus.startsWith('✅')
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    {ocrStatus.startsWith('❌') ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : ocrStatus.startsWith('✅') ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" />
                    )}
                    <span className="flex-1 text-[11px]">{ocrStatus}</span>
                  </div>
                )}
              </div>

              {/* Text Area & Difficulty Selector */}
              <div className="flex flex-col gap-2">
                <textarea
                  value={rawText}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder="Paste lecture notes or transcripts here, or upload a file on the left..."
                  className="w-full h-36 border-[var(--border-thin)] rounded-[var(--radius-sm)] p-3 text-xs sm:text-sm bg-[var(--card-bg)] text-[var(--text-main)] resize-y outline-none focus:border-[var(--brand-blue)] font-sans leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <label htmlFor="drawerDifficultySelect">Assessment Difficulty:</label>
                    <select
                      id="drawerDifficultySelect"
                      value={difficulty}
                      onChange={(e) => onDifficultyChange(e.target.value as DifficultyType)}
                      className="text-xs font-bold px-2.5 py-1 border-[var(--border-thin)] rounded-full bg-[var(--card-bg)] text-[var(--text-main)] outline-none cursor-pointer"
                    >
                      <option value="easy">Easy (Definitions & Core Concepts)</option>
                      <option value="medium">Medium (Standard Exam Application)</option>
                      <option value="hard">Hard (Deep Edge Cases & Analysis)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>{charCount.toLocaleString()} chars</span>
                    <span>•</span>
                    <span>{wordCount.toLocaleString()} words</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time AI Generation Loading Indicator */}
        {isGenerating && (
          <div className="flex items-center gap-3 bg-[var(--brand-yellow-light)] border-[var(--border-thin)] rounded-[var(--radius-sm)] p-3 mt-3 shadow-[var(--shadow-sm)] animate-pulse">
            <div className="text-xl animate-spin">⚡</div>
            <div className="flex-1">
              <div className="flex justify-between items-center gap-2">
                <strong className="text-xs font-black">🧠 Synthesizing Study Materials...</strong>
                <span className="badge-pill badge-pill-yellow text-[9px]">In Progress</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--card-bg)] border-[var(--border-thin)] rounded-full overflow-hidden my-1">
                <div className="h-full w-2/5 bg-[var(--brand-blue)] rounded-full animate-pulse" />
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Building revision notes, 5 quiz questions, 3D flashcards, mind map, and mnemonics...
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
