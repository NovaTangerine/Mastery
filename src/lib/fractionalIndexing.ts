import { generateKeyBetween } from 'fractional-indexing';

/**
 * A safe wrapper around fractional-indexing's generateKeyBetween.
 * 
 * 1. Monitors length to warn about potential precision/storage limits.
 * 2. Provides a fallback if the algorithm throws an error (e.g., identical adjacent keys).
 */
export function safeGenerateKeyBetween(a: string | null | undefined, b: string | null | undefined): string {
  try {
    const key = generateKeyBetween(a, b);
    
    // Log a warning if the key is getting dangerously long.
    // Firestore limit is 1500 bytes for a document ID, but we want to catch this way earlier
    // to prevent performance degradation and unbounded growth.
    if (key.length > 60) {
      console.warn(`[Fractional Indexing] Key length exceeded 60 characters: ${key.length}. Consider rebalancing.`);
      // In a real production app, we would send this to a telemetry service:
      // logAppEvent('fractional_index_warning', { length: key.length });
    }
    
    return key;
  } catch (error) {
    console.error(`[Fractional Indexing] Error generating key between "${a}" and "${b}":`, error);
    
    // Fallback: If we fail to generate a key between A and B, we'll try to just append after A.
    // If A is null, we try to prepend before B.
    // If both fail, we generate a completely new key at the end of the default sequence.
    try {
      if (a) {
        return generateKeyBetween(a, null);
      } else if (b) {
        return generateKeyBetween(null, b);
      }
    } catch (fallbackError) {
      console.error(`[Fractional Indexing] Fallback also failed:`, fallbackError);
    }
    
    // Absolute last resort: generate a random string that sorts after 'a' (very hacky, but prevents crash)
    // In practice, this should almost never happen unless the fractional-indexing library has a critical bug.
    return (a || '') + 'V'; 
  }
}
