'use client';

import React, { useState, useEffect } from 'react';
import { X, Cpu, ExternalLink, Layers, ShieldCheck, Check } from 'lucide-react';
import { parseGroqKeyPool, ACTIVE_GROQ_MODELS, resolveGroqModel } from '../lib/groq';

interface GroqModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeys: string[];
  currentModel: string;
  onSave: (keys: string[], model: string) => void;
  onClear: () => void;
}

export const GroqModal: React.FC<GroqModalProps> = ({
  isOpen,
  onClose,
  currentKeys,
  currentModel,
  onSave,
  onClear,
}) => {
  const [keysInput, setKeysInput] = useState(currentKeys.join('\n'));
  const [model, setModel] = useState(currentModel);

  useEffect(() => {
    setKeysInput(currentKeys.join('\n'));
    setModel(currentModel);
  }, [currentKeys, currentModel, isOpen]);

  if (!isOpen) return null;

  const parsedList = parseGroqKeyPool(keysInput);
  const keysCount = parsedList.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-[var(--border-thin)] bg-[var(--card-bg-alt)] flex items-center justify-center font-black cursor-pointer hover:bg-rose-100"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-black text-lg flex items-center gap-2 mb-1 pb-2 border-b-[var(--border-thin)]">
          <Cpu className="w-5 h-5 text-[var(--brand-blue)]" /> Groq LPU Multi-Key Rotation Pool
        </h3>

        {/* Load Balancing & Failover Badge */}
        <div className="bg-amber-50 border-2 border-amber-400 rounded-[var(--radius-sm)] p-2.5 mb-3 text-left flex items-start gap-2">
          <Layers className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="text-amber-900 block font-black">
              Multi-Key Load Balancer & Rate Limit Shield
            </strong>
            <p className="text-amber-800 text-[11px] leading-tight mt-0.5">
              Paste up to 5 (or more) free Groq API keys below. Requests are distributed across them in a round-robin pool. If any key hits a 429 rate limit, the app instantly fails over to the next active key!
            </p>
          </div>
        </div>

        {/* Keys Input Textarea */}
        <div className="mb-3 text-left">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-black uppercase">
              Groq API Keys Pool (1 per line or comma-separated)
            </label>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                keysCount > 1
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                  : keysCount === 1
                  ? 'bg-blue-100 border-blue-500 text-blue-800'
                  : 'bg-slate-100 border-slate-400 text-slate-600'
              }`}
            >
              {keysCount > 1
                ? `⚡ ${keysCount} Keys Active (Load Balanced)`
                : keysCount === 1
                ? '⚡ 1 Key Active'
                : '0 Keys (Demo Mode)'}
            </span>
          </div>

          <textarea
            value={keysInput}
            onChange={(e) => setKeysInput(e.target.value)}
            placeholder={`gsk_key1_abc...\ngsk_key2_def...\ngsk_key3_ghi...\ngsk_key4_jkl...\ngsk_key5_mno...`}
            rows={5}
            className="w-full px-3 py-2 text-xs font-mono border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)] resize-y"
          />

          <div className="flex justify-between items-center mt-1 text-[11px]">
            <span className="text-[var(--text-muted)] font-medium">
              Keys are encrypted & stored in your local browser storage
            </span>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--brand-blue)] font-bold flex items-center gap-1 hover:underline"
            >
              Get free Groq Keys <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Model Selection */}
        <div className="mb-4 text-left">
          <label className="block text-xs font-black uppercase mb-1">
            Groq LLM Model
          </label>
          <select
            value={resolveGroqModel(model)}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none cursor-pointer"
          >
            {ACTIVE_GROQ_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onSave(parsedList, model);
              onClose();
            }}
            className="flex-1 comic-btn yellow py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-[var(--shadow-sm)]"
          >
            <Check className="w-4 h-4" /> Save Key Pool ({keysCount} Key{keysCount !== 1 ? 's' : ''})
          </button>
          {keysCount > 0 && (
            <button
              onClick={() => {
                onClear();
                setKeysInput('');
              }}
              className="comic-btn py-2 px-3 text-xs font-bold text-rose-600 bg-rose-50 cursor-pointer"
            >
              Clear Pool
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
