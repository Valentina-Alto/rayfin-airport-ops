import { useEffect, useState } from 'react';

import { isLocalBackend } from '@/services/rayfinClient';
import {
  isDatabaseSeeded,
  seedFabricDatabase,
  type SeedProgress,
  type SeedResult,
} from '@/services/seedFabric';

type Phase = 'checking' | 'empty' | 'seeded' | 'running' | 'done' | 'error';

/**
 * One-click control to populate the deployed Fabric SQL database with the demo
 * dataset. Only rendered against a real (non-localhost) backend, and only works
 * from an authenticated session — i.e. when the app is opened inside the Fabric
 * Portal, where SSO establishes the session the data API requires.
 */
export function SeedDatabaseButton() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [progress, setProgress] = useState<SeedProgress | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLocalBackend()) return;
    let cancelled = false;
    isDatabaseSeeded()
      .then((seeded) => {
        if (!cancelled) setPhase(seeded ? 'seeded' : 'empty');
      })
      .catch(() => {
        if (!cancelled) setPhase('empty');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The seeder writes to the live backend, so hide it entirely in local dev.
  if (isLocalBackend()) return null;

  const run = async (force: boolean) => {
    setPhase('running');
    setError(null);
    setProgress(null);
    setResult(null);
    try {
      const res = await seedFabricDatabase({ force, onProgress: setProgress });
      setResult(res);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seeding failed.');
      setPhase('error');
    }
  };

  const baseBtn =
    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60';

  if (phase === 'running') {
    const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-sky-700/60 bg-sky-500/10 px-3 py-1.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
        <span className="text-xs text-sky-200">
          Seeding {progress?.step ?? '…'} · {pct}%
        </span>
      </div>
    );
  }

  if (phase === 'done' && result) {
    return (
      <span className="rounded-lg border border-emerald-700/60 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
        {result.skipped
          ? 'Database already populated'
          : `Seeded ✓ ${result.gates} gates · ${result.aircraft} aircraft · ${result.flights} flights · ${result.cargo} cargo · ${result.employees} staff`}
      </span>
    );
  }

  if (phase === 'error') {
    return (
      <button
        onClick={() => void run(false)}
        title={error ?? undefined}
        className={`${baseBtn} border-rose-700/60 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20`}
      >
        Seeding failed — retry
      </button>
    );
  }

  if (phase === 'seeded') {
    return (
      <button
        onClick={() => void run(true)}
        className={`${baseBtn} border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800`}
      >
        Re-seed Fabric DB
      </button>
    );
  }

  // 'empty' or 'checking'
  return (
    <button
      onClick={() => void run(false)}
      disabled={phase === 'checking'}
      className={`${baseBtn} border-sky-600 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25`}
    >
      Seed Fabric DB
    </button>
  );
}
