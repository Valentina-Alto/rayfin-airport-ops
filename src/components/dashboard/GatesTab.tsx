import { useMemo } from 'react';

import {
  Badge,
  Card,
  ProgressBar,
  SectionTitle,
  StatCard,
  gateStatusColor,
  titleCase,
} from '@/components/dashboard/primitives';
import type { AirportDataset } from '@/domain/types';

export function GatesTab({ data }: { data: AirportDataset }) {
  const occupied = data.gates.filter((g) => g.status === 'occupied').length;
  const available = data.gates.filter((g) => g.status === 'available').length;
  const maint = data.gates.filter((g) => g.status === 'maintenance').length;
  const utilisation = data.gates.length ? occupied / data.gates.length : 0;

  const byTerminal = useMemo(() => {
    const map = new Map<string, { total: number; occupied: number }>();
    for (const g of data.gates) {
      const e = map.get(g.terminal) ?? { total: 0, occupied: 0 };
      e.total += 1;
      if (g.status === 'occupied') e.occupied += 1;
      map.set(g.terminal, e);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [data]);

  const flightCountByGate = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of data.flights) {
      if (f.gateId && f.status !== 'departed' && f.status !== 'landed' && f.status !== 'cancelled') {
        m.set(f.gateId, (m.get(f.gateId) ?? 0) + 1);
      }
    }
    return m;
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total stands" value={data.gates.length} accent="text-sky-300" />
        <StatCard label="Occupied" value={occupied} hint={`${Math.round(utilisation * 100)}% utilisation`} accent="text-indigo-300" />
        <StatCard label="Available" value={available} accent="text-emerald-300" />
        <StatCard label="Maintenance" value={maint} accent="text-amber-300" />
      </div>

      <Card>
        <SectionTitle title="Utilisation by terminal" />
        <div className="space-y-3 px-5 pb-5">
          {byTerminal.map(([terminal, e]) => (
            <div key={terminal}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>{terminal}</span>
                <span>
                  {e.occupied}/{e.total} occupied
                </span>
              </div>
              <ProgressBar value={e.total ? e.occupied / e.total : 0} className="bg-indigo-400" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Stands" subtitle="All gates and current load" />
        <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {data.gates.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-semibold text-slate-100">{g.code}</span>
                <Badge className={gateStatusColor[g.status]}>{titleCase(g.status)}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {g.terminal} · {titleCase(g.gateType)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {titleCase(g.maxAircraftSize)}-body · {g.hasJetBridge ? 'jet bridge' : 'bus'}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {flightCountByGate.get(g.id) ?? 0} active flight(s)
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
