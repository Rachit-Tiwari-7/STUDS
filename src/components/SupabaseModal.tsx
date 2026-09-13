'use client';

import React, { useState } from 'react';
import { X, Cloud, LogIn, UserPlus, LogOut, RefreshCw } from 'lucide-react';
import { getSupabaseClient, initSupabase, clearSupabase } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onAuthChange: (email: string | null) => void;
  onSyncCloud: () => void;
  onShowToast: (msg: string) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onAuthChange,
  onSyncCloud,
  onShowToast,
}) => {
  const [url, setUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('studs_supabase_url') || localStorage.getItem('studypulse_supabase_url') || '' : ''));
  const [anonKey, setAnonKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('studs_supabase_key') || localStorage.getItem('studypulse_supabase_key') || '' : ''));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSaveKeys = () => {
    if (!url.trim() || !anonKey.trim()) {
      onShowToast('Enter both Supabase URL and Anon Key.');
      return;
    }
    localStorage.setItem('studs_supabase_url', url.trim());
    localStorage.setItem('studs_supabase_key', anonKey.trim());
    const client = initSupabase(url.trim(), anonKey.trim());
    if (client) {
      onShowToast('Supabase client initialized successfully!');
    } else {
      onShowToast('Invalid Supabase parameters.');
    }
  };

  const handleClearKeys = () => {
    clearSupabase();
    setUrl('');
    setAnonKey('');
    onAuthChange(null);
    onShowToast('Supabase credentials cleared. Switched to local mode.');
  };

  const handleSignIn = async () => {
    const client = getSupabaseClient();
    if (!client) {
      onShowToast('Save Supabase URL & Key first!');
      return;
    }
    if (!email || !password) {
      onShowToast('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      onShowToast(`Sign in error: ${error.message}`);
    } else if (data.session?.user) {
      onAuthChange(data.session.user.email || 'authenticated');
      onShowToast('Logged in to Supabase cloud!');
      onClose();
    }
  };

  const handleSignUp = async () => {
    const client = getSupabaseClient();
    if (!client) {
      onShowToast('Save Supabase URL & Key first!');
      return;
    }
    if (!email || !password) {
      onShowToast('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await client.auth.signUp({ email, password });
    setIsSubmitting(false);

    if (error) {
      onShowToast(`Sign up error: ${error.message}`);
    } else {
      onShowToast('Sign up successful! Please check your email or sign in.');
    }
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
      onAuthChange(null);
      onShowToast('Signed out of Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border-[var(--border-thick)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-[var(--border-thin)] bg-[var(--card-bg-alt)] flex items-center justify-center font-black cursor-pointer hover:bg-rose-100"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-black text-lg flex items-center gap-2 mb-2 pb-2 border-b-[var(--border-thin)]">
          <Cloud className="w-5 h-5 text-[var(--brand-blue)]" /> Supabase Cloud Sync & Auth
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
          Connect your Supabase project to authenticate and backup your study notes, streak, and flashcards across devices.
        </p>

        {/* API Keys */}
        <div className="mb-3 text-left">
          <label className="block text-xs font-black uppercase mb-1">
            Supabase Project URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-project.supabase.co"
            className="w-full px-3 py-2 text-xs border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)]"
          />
        </div>

        <div className="mb-3 text-left">
          <label className="block text-xs font-black uppercase mb-1">
            Supabase Anon Key
          </label>
          <input
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-3 py-2 text-xs border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none focus:border-[var(--brand-blue)]"
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleSaveKeys}
            className="btn-comic btn-comic-sm btn-comic-yellow"
          >
            Save API Keys
          </button>
          <button
            onClick={handleClearKeys}
            className="btn-comic btn-comic-sm"
          >
            Clear Keys
          </button>
        </div>

        <hr className="border-t-[var(--border-thin)] my-3.5" />

        {/* Auth Section */}
        <div className="text-left">
          <h4 className="font-extrabold text-sm mb-2">User Authentication</h4>

          {userEmail ? (
            <div>
              <p className="text-xs mb-3">
                Logged in as: <strong className="text-[var(--brand-blue)]">{userEmail}</strong>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onSyncCloud}
                  className="btn-comic btn-comic-sm btn-comic-primary"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Workspace Now</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn-comic btn-comic-sm btn-comic-coral"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase mb-0.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-3 py-1.5 text-xs border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase mb-0.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 text-xs border-[var(--border-thin)] rounded-[var(--radius-sm)] bg-[var(--card-bg-alt)] text-[var(--text-main)] outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleSignIn}
                  disabled={isSubmitting}
                  className="btn-comic btn-comic-sm btn-comic-primary"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={handleSignUp}
                  disabled={isSubmitting}
                  className="btn-comic btn-comic-sm btn-comic-yellow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
