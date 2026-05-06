import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Persisted rate limiter using Supabase.
 * Incompatible with Vercel serverless when using in-memory Map.
 */
export async function rateLimit(identifier: string, limit: number, windowMs: number) {
  try {
    const supabase = await createSupabaseServerClient()
    const currentTime = new Date()

    // 1. Récupérer l'état actuel pour cet identifiant
    const { data, error } = await supabase
      .from('rate_limits')
      .select('count, reset_at')
      .eq('identifier', identifier)
      .single()

    // Gestion du cas "pas de résultat" (PGRST116)
    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit database error:', error)
      return { success: true } // Fail open par sécurité
    }

    const resetAt = data?.reset_at ? new Date(data.reset_at) : null

    // 2. Si pas d'entrée ou fenêtre expirée : réinitialiser
    if (!data || (resetAt && resetAt < currentTime)) {
      const newResetAt = new Date(currentTime.getTime() + windowMs).toISOString()
      
      const { error: upsertError } = await supabase
        .from('rate_limits')
        .upsert({ 
          identifier, 
          count: 1, 
          reset_at: newResetAt 
        }, { onConflict: 'identifier' })

      if (upsertError) console.error('Rate limit upsert error:', upsertError)
      return { success: true }
    }

    // 3. Vérifier si la limite est atteinte
    if (data.count >= limit) {
      return { success: false }
    }

    // 4. Incrémenter le compteur
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ count: data.count + 1 })
      .eq('identifier', identifier)

    if (updateError) console.error('Rate limit update error:', updateError)
    return { success: true }

  } catch (err) {
    console.error('Rate limit unexpected error:', err)
    return { success: true } // Fail open
  }
}

/*
-- SQL POUR LA CRÉATION DE LA TABLE (À exécuter dans le SQL Editor de Supabase) :
--
-- CREATE TABLE IF NOT EXISTS rate_limits (
--   identifier TEXT PRIMARY KEY,
--   count INTEGER DEFAULT 0,
--   reset_at TIMESTAMPTZ NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
--
-- CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at);
--
-- -- Désactiver RLS pour cette table si elle est uniquement gérée côté serveur via le client admin
-- -- ou ajouter une policy service_role.
-- ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role full access" ON rate_limits FOR ALL TO service_role USING (true);
*/
