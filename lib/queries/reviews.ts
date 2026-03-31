import { supabase } from '../supabase';
import type { ReviewRow, ReviewInsert } from '../database.types';

export interface ReviewWithAuthor extends ReviewRow {
  users: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Fetch all approved reviews for a destination, newest first.
 * Includes the reviewer's display name and avatar.
 */
export async function getReviewsByDestination(
  destinationId: string,
  limit = 20,
): Promise<ReviewWithAuthor[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      users (
        display_name,
        avatar_url
      )
    `)
    .eq('destination_id', destinationId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ReviewWithAuthor[];
}

/**
 * Submit a new review for a destination. The authenticated user's id is
 * taken from the active Supabase session — do not pass it manually.
 *
 * Reviews are created with status 'pending' by default (see DB default).
 */
export async function submitReview(
  review: Omit<ReviewInsert, 'user_id'>,
): Promise<ReviewRow> {
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    throw new Error('Must be authenticated to submit a review');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({ ...review, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}
