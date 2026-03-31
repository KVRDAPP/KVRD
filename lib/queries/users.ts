import { supabase } from '../supabase';
import type { UserRow, UserUpdate } from '../database.types';

/**
 * Fetch a user's public profile by their auth id.
 */
export async function getUserProfile(userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update the currently authenticated user's profile fields.
 * Pass only the fields you want to change.
 */
export async function updateUserProfile(updates: UserUpdate): Promise<UserRow> {
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    throw new Error('Must be authenticated to update profile');
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle discreet mode on/off for the currently authenticated user.
 * Returns the updated row.
 */
export async function toggleDiscreetMode(enabled: boolean): Promise<UserRow> {
  return updateUserProfile({ discreet_mode_enabled: enabled });
}
