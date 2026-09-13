'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, ExternalLink, Sparkles, Eye, Check } from 'lucide-react';
import {
  OPENROUTER_VISION_MODELS,
  OPENROUTER_TEXT_MODELS,
  DEFAULT_OPENROUTER_VISION_MODEL,
  DEFAULT_OPENROUTER_TEXT_MODEL,
} from '../lib/openrouter';

interface OpenRouterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  currentVisionModel: string;
  currentTextModel: string;
  onSave: (key: string, visionModel: string, textModel: string) => void;
  onClear: () => void;
}

export const OpenRouterModal: React.FC<OpenRouterModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  currentVisionModel,
  currentTextModel,
  onSave,
  onClear,
}) => {
  const [apiKey, setApiKey] = useState(currentKey);
  const [visionModel, setVisionModel] = useState(currentVisionModel || DEFAULT_OPENROUTER_VISION_MODEL);
  const [textModel, setTextModel] = useState(currentTextModel || DEFAULT_OPENROUTER_TEXT_MODEL);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(currentKey);
    setVisionModel(currentVisionModel || DEFAULT_OPENROUTER_VISION_MODEL);
    setTextModel(currentTextModel || DEFAULT_OPENROUTER_TEXT_MODEL);
  }, [currentKey, currentVisionModel, currentTextModel, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-[var(--border-thin)] bg-[var(--card-bg-alt)] flex items-center justify-center font-black cursor-pointer hover:bg-rose-100"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-black text-lg flex items-center gap-2 mb-1 pb-2 border-b-[var(--border-thin)]">
          <Globe className="w-5 h-5 text-[var(--brand-blue)]" /> OpenRouter API (100% Free Models)
        </h3>
        
        {/* Strict Free Badge */}
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-[var(--radius-sm)] p-2 mb-3 text-left flex items-start gap-2">
          <span className="text-emerald-600 font-black text-sm">🟢</span>
          <div>
            <strong className="text-emerald-900 text-xs block">100% Free Vision OCR & 3-Model Auto-Fallback</strong>
            <p className="text-[11px] text-emerald-800 leading-tight">
              Only $0.00 free tier models are used. If model #1 has a queue or is rate-limited, the system automatically falls back to model #2, then model #3!
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mb-3 text-left">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-black uppercase">OpenRouter API Key</label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[10px] font-bold text-[var(--brand-blue)] flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" /> {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full px-3 py-2 text-xs border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)]"
          />
        </div>

        {/* Vision OCR Model Selection */}
        <div className="mb-3 text-left">
          <label className="block text-xs font-black uppercase mb-1">
            📷 Primary Free OCR Model
          </label>
          <select
            value={visionModel}
            onChange={(e) => setVisionModel(e.target.value)}
            className="w-full px-3 py-2 text-xs border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)] cursor-pointer"
          >
            {OPENROUTER_VISION_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="mt-1.5 p-2 bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded text-[10px] text-[var(--text-muted)] space-y-0.5">
            <div className="font-extrabold text-[var(--text-main)]">🔄 3-Tier Free Auto-Fallback Chain:</div>
            <div>1️⃣ {visionModel.split('/')[1] || visionModel} (Primary)</div>
            <div>2️⃣ Gemma 4 26B Vision (Free Fallback 1)</div>
            <div>3️⃣ OpenRouter Multi-Model Free Router (Fallback 2)</div>
          </div>
        </div>

        {/* Text Generation Model Selection */}
        <div className="mb-4 text-left">
          <label className="block text-xs font-black uppercase mb-1">
            ⚡ Workspace Synthesis Model
          </label>
          <select
            value={textModel}
            onChange={(e) => setTextModel(e.target.value)}
            className="w-full px-3 py-2 text-xs border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)] cursor-pointer"
          >
            {OPENROUTER_TEXT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              onSave(apiKey.trim(), visionModel, textModel);
              onClose();
            }}
            className="flex-1 comic-btn yellow py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Save OpenRouter Settings
          </button>
          {apiKey && (
            <button
              onClick={() => {
                onClear();
                setApiKey('');
              }}
              className="comic-btn py-2 px-3 text-xs font-bold text-rose-600 bg-rose-50 cursor-pointer"
            >
              Disconnect
            </button>
          )}
        </div>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand-blue)] hover:underline"
        >
          Get your OpenRouter API Key <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
