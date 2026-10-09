import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '../types/admin';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aftmqdmiwvpbpsdmsfbu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdG1xZG1pd3ZwYnBzZG1zZmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTA4NDgsImV4cCI6MjEwNTY2Njg0OH0.j6721wSg1-1tSg17r12903_dummy';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing in client environment variables, applying fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function getCurrentAdmin(): Promise<{ user: any; profile: UserProfile } | null> {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;

    // Fast check for known admin email or metadata
    let role = user.user_metadata?.role || (user.email === 'admin@foodfax.in' ? 'admin' : null);
    let profile: any = null;

    if (!role) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profile = data;
        role = profile?.role;
      } catch {
        // Fallback
      }
    }

    if (role !== 'admin' && role !== 'super_admin') {
      return null;
    }

    return {
      user,
      profile: profile || {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Admin',
        role: 'admin',
        is_active: true,
        phone: user.user_metadata?.phone || null,
        created_at: user.created_at || new Date().toISOString(),
      },
    };
  } catch (err) {
    console.warn('[getCurrentAdmin] Error checking session:', err);
    return null;
  }
}

export async function signInAdmin(email: string, pass: string): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Authentication failed');
  }

  // Strictly verify admin authorization
  let role = data.user.user_metadata?.role || (data.user.email === 'admin@foodfax.in' ? 'admin' : null);
  let profile: any = null;

  if (!role) {
    try {
      const { data: prof } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = prof;
      role = profile?.role;
    } catch {
      // Non-fatal
    }
  }

  if (role !== 'admin' && role !== 'super_admin') {
    // Immediately terminate session if not an admin
    await supabase.auth.signOut();
    throw new Error('ACCESS_DENIED_NOT_ADMIN');
  }

  return profile || {
    id: data.user.id,
    email: data.user.email || '',
    full_name: data.user.user_metadata?.full_name || 'Admin',
    role: 'admin',
    is_active: true,
    phone: data.user.user_metadata?.phone || null,
    created_at: data.user.created_at || new Date().toISOString(),
  };
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}
