import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { Game, MOCK_GAMES } from './data';

interface IgdbResult {
  id: number;
  name: string;
  cover?: { image_id?: string };
  first_release_date?: number;
}

const fromIgdb = (r: IgdbResult): Game => ({
  id: `igdb-${r.id}`,
  title: r.name,
  year: r.first_release_date ? new Date(r.first_release_date * 1000).getUTCFullYear() : undefined,
  coverUrl: r.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${r.cover.image_id}.jpg` : undefined,
});

/**
 * Searches the local mock list instantly, then merges in results from
 * POST /api/games/search (IGDB, or the server's own offline mock list).
 * The API needs a Firebase ID token, so until pass 2 adds real sign-in this
 * stays on the local list.
 */
export function useGameSearch(query: string) {
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    const local = MOCK_GAMES.filter((g) => g.title.toLowerCase().includes(q));
    setResults(local);

    const fbUser = auth.currentUser;
    if (!fbUser) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const token = await fbUser.getIdToken();
        const res = await fetch('/api/games/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: q }),
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data: IgdbResult[] = await res.json();
        const seen = new Set(local.map((g) => g.title.toLowerCase()));
        const remote = (Array.isArray(data) ? data : []).map(fromIgdb).filter((g) => !seen.has(g.title.toLowerCase()));
        setResults([...local, ...remote].slice(0, 8));
      } catch {
        /* offline or aborted: local results stand */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  return { results, loading };
}
