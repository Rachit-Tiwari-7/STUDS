import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { WorkspaceData } from './types';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string | null; key: string | null } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;

  let localUrl: string | null = null;
  let localKey: string | null = null;

  if (typeof window !== 'undefined') {
    localUrl = localStorage.getItem('studs_supabase_url') || localStorage.getItem('studypulse_supabase_url');
    localKey = localStorage.getItem('studs_supabase_key') || localStorage.getItem('studypulse_supabase_key');
  }

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      supabaseClientInstance = createClient(url, key);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return supabaseClientInstance;
}

export function initSupabase(url: string, key: string): SupabaseClient | null {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    supabaseClientInstance = createClient(cleanUrl, cleanKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem('studs_supabase_url', cleanUrl);
      localStorage.setItem('studs_supabase_key', cleanKey);
    }
    return supabaseClientInstance;
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
    return null;
  }
}

export function clearSupabase(): void {
  supabaseClientInstance = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('studs_supabase_url');
    localStorage.removeItem('studs_supabase_key');
    localStorage.removeItem('studypulse_supabase_url');
    localStorage.removeItem('studypulse_supabase_key');
  }
}

// ============================================================================
// Auth Helpers
// ============================================================================

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured. Please add your credentials.');
  return await client.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured. Please add your credentials.');
  return await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured. Please add your credentials.');
  return await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
}

export async function signOutUser() {
  const client = getSupabaseClient();
  if (!client) return { error: null };
  return await client.auth.signOut();
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { session } } = await client.auth.getSession();
    return session;
  } catch (err) {
    console.error('Error fetching session:', err);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const client = getSupabaseClient();
  if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
  return client.auth.onAuthStateChange(callback);
}

// ============================================================================
// Workspace Cloud Sync
// ============================================================================

export async function syncWorkspaceCloud(
  workspace: WorkspaceData,
  streak: number
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await client
      .from('studypulse_workspaces')
      .upsert(
        {
          user_id: session.user.id,
          streak: streak,
          workspace: workspace,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function fetchWorkspaceCloud(): Promise<{
  success: boolean;
  workspace?: WorkspaceData;
  streak?: number;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await client
      .from('studypulse_workspaces')
      .select('workspace, streak')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, error: 'No cloud workspace found for this user' };

    return {
      success: true,
      workspace: data.workspace as WorkspaceData,
      streak: data.streak,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
