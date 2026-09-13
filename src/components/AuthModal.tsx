'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2, Settings, ShieldCheck } from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  isSupabaseConfigured,
  getSupabaseCredentials,
  initSupabase,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic Supabase Credentials Config
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const isConf = isSupabaseConfigured();
      setConfigured(isConf);
      const creds = getSupabaseCredentials();
      if (creds.url) setCustomUrl(creds.url);
      if (creds.key) setCustomKey(creds.key);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setErrorMsg('Please enter both Supabase URL and Anon Public Key.');
      return;
    }
    const client = initSupabase(customUrl, customKey);
    if (client) {
      setConfigured(true);
      setShowConfig(false);
      setErrorMsg(null);
      setSuccessMsg('Supabase credentials saved successfully!');
    } else {
      setErrorMsg('Invalid Supabase URL or Key.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!configured) {
      setErrorMsg('Supabase is not configured yet! Click "Configure Project" below to add your URL & Key.');
      setShowConfig(true);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      if (tab === 'signin') {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) throw error;
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      } else {
        const { data, error } = await signUpWithEmail(email.trim(), password);
        if (error) throw error;
        if (data?.user && !data.session) {
          setSuccessMsg('Verification email sent! Please check your inbox to confirm your account.');
        } else {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 600);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMsg(null);
    if (!configured) {
      setErrorMsg('Supabase is not configured yet! Click "Configure Project" below to add your URL & Key.');
      setShowConfig(true);
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="comic-card w-full max-w-md bg-[var(--card-bg)] border-[var(--border-thick)] shadow-[var(--shadow-xl)] p-6 relative rounded-[var(--radius-lg)] text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--card-bg-alt)] border-[var(--border-thin)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--brand-yellow)] border-[var(--border-thick)] rounded-full px-3.5 py-1 text-xs font-black shadow-[var(--shadow-sm)] mb-2 text-[#111827]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CLOUD STUDY SYNC</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight font-studs">
            {tab === 'signin' ? 'Welcome Back to STUDS' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
            Sync study schedules, flashcard decks, and quiz scores across all your devices.
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex rounded-lg border-[var(--border-thick)] p-1 bg-[var(--card-bg-alt)] mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-extrabold rounded-md transition-all cursor-pointer ${
              tab === 'signin'
                ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-[var(--shadow-sm)] border-[var(--border-thin)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-extrabold rounded-md transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-[var(--shadow-sm)] border-[var(--border-thin)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-[var(--radius-sm)] border-[var(--border-thick)] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold flex items-start gap-2 shadow-[var(--shadow-sm)]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-[var(--radius-sm)] border-[var(--border-thick)] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-start gap-2 shadow-[var(--shadow-sm)]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-[var(--radius-sm)] border-[var(--border-thick)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] shadow-[var(--shadow-sm)] font-semibold"
              />
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-[var(--radius-sm)] border-[var(--border-thick)] bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] shadow-[var(--shadow-sm)] font-semibold"
              />
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-comic btn-comic-primary py-2.5 text-sm font-black shadow-[var(--shadow-md)] mt-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading
              ? 'Authenticating...'
              : tab === 'signin'
              ? '⚡ Sign In with Email'
              : '🚀 Create Free Account'}
          </button>
        </form>

        {/* OAuth Separator */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--card-border)] opacity-30" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--card-bg)] px-2 text-[var(--text-muted)] font-black">or continue with</span>
          </div>
        </div>

        {/* Social Auth Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={isLoading}
            className="btn-comic btn-comic-sm py-2 bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)] border-[var(--border-thick)] shadow-[var(--shadow-sm)] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.4 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={isLoading}
            className="btn-comic btn-comic-sm py-2 bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)] border-[var(--border-thick)] shadow-[var(--shadow-sm)] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Project Setup / Credentials Drawer */}
        <div className="mt-5 pt-3 border-t border-[var(--card-border)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
              <ShieldCheck className={`w-3.5 h-3.5 ${configured ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span>Supabase: {configured ? 'Connected' : 'Not Connected'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] font-black text-[var(--brand-blue)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>{showConfig ? 'Hide Config' : 'Configure Project'}</span>
            </button>
          </div>

          {showConfig && (
            <form onSubmit={handleSaveCredentials} className="mt-3 p-3 bg-[var(--card-bg-alt)] border-[var(--border-thin)] rounded-[var(--radius-sm)] space-y-2 text-left animate-in slide-in-from-top-2 duration-150">
              <div className="text-[11px] font-bold text-[var(--text-muted)]">
                Enter your Supabase credentials (saved in browser):
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--text-muted)] mb-0.5">
                  Project URL
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-2 py-1 text-xs rounded border-[var(--border-thin)] bg-[var(--card-bg)] text-[var(--text-main)] font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--text-muted)] mb-0.5">
                  Anon Public Key
                </label>
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-2 py-1 text-xs rounded border-[var(--border-thin)] bg-[var(--card-bg)] text-[var(--text-main)] font-mono"
                  required
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 btn-comic btn-comic-sm bg-[var(--brand-yellow)] text-[#111827] font-black text-xs py-1"
                >
                  Save & Connect
                </button>
                {configured && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUrl('');
                      setCustomKey('');
                      setConfigured(false);
                      initSupabase('', '');
                    }}
                    className="btn-comic btn-comic-sm text-xs py-1 text-red-600 font-bold"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
