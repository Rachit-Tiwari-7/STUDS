import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkspaceData } from './types';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;
  if (typeof window === 'undefined') return null;

  const url = localStorage.getItem('studs_supabase_url') || localStorage.getItem('studypulse_supabase_url');
  const key = localStorage.getItem('studs_supabase_key') || localStorage.getItem('studypulse_supabase_key');
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
    supabaseClientInstance = createClient(url, key);
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
