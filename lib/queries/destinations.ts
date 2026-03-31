import { supabase } from '../supabase';
import type { DestinationRow, SafetyScoreRow } from '../database.types';

export interface DestinationWithScore extends DestinationRow {
  safety_scores: SafetyScoreRow | null;
}

/**
 * Fetch a single destination by ID, including its latest safety score.
 */
export async function getDestinationById(
  id: string,
): Promise<DestinationWithScore | null> {
  const { data, error } = await supabase
    .from('destinations')
    .select(`
      *,
      safety_scores (*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DestinationWithScore | null;
}

/**
 * Search destinations by name (case-insensitive prefix / substring match).
 */
export async function searchDestinations(
  query: string,
  limit = 20,
): Promise<DestinationRow[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Return the top N destinations ordered by composite safety score (desc).
 * Optionally filter by region.
 */
export async function getTopDestinations(opts?: {
  limit?: number;
  region?: string;
}): Promise<DestinationWithScore[]> {
  const limit = opts?.limit ?? 10;

  let query = supabase
    .from('destinations')
    .select(`
      *,
      safety_scores (*)
    `)
    .order('composite_score', {
      referencedTable: 'safety_scores',
      ascending: false,
    })
    .limit(limit);

  if (opts?.region) {
    query = query.eq('region', opts.region);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DestinationWithScore[];
}
