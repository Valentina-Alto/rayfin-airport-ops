import { useMemo, useState } from 'react';

import {
  Badge,
  Card,
  ProgressBar,
  SectionTitle,
  StatCard,
  cargoStatusColor,
  fmtWeight,
  priorityColor,
  titleCase,
} from '@/components/dashboard/primitives';
import type { AirportDataset, CargoCategory } from '@/domain/types';
import { groupCount } from '@/domain/metrics';

const CATEGORIES: CargoCategory[] = [
  'general',
  'perishable',
  'dangerous',
  'pharma',
  'mail',
  'valuable',
];

export function CargoTab({ data }: { data: AirportDataset }) {
  const [filter, setFilter] = useState<CargoCategory | 'all'>('all');

  const totalKg = data.cargo.reduce((s, c) => s + c.weightKg, 0);
  const inProgress = data.cargo.filter(
    (c) => c.status !== 'delivered' && c.status !== 'booked'
  ).length;
  const critical = data.cargo.filter((c) => c.priority === 'critical').length;

  const tonnageByCategory = useMemo(() => {
    const m = new Map<CargoCategory, number>();
    for (const c of data.cargo) m.set(c.category, (m.get(c.category) ?? 0) + c.weightKg);
    const max = Math.max(1, ...m.values());
    return CATEGORIES.map((cat) => ({ cat, kg: m.get(cat) ?? 0, ratio: (m.get(cat) ?? 0) / max }));
  }, [data]);

  const byPriority = groupCount(data.cargo, (c) => c.priority);
  const flightByCargo = useMemo(
    () => new Map(data.flights.map((f) => [f.id, f.flightNumber] as const)),
    [data]
  );

  const rows = data.cargo.filter((c) => filter === 'all' || c.category === filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total tonnage" value={`${(totalKg / 1000).toFixed(1)} t`} accent="text-amber-300" />
        <StatCard label="Shipments" value={data.cargo.length} accent="text-sky-300" />
        <StatCard label="In handling" value={inProgress} accent="text-indigo-300" />
        <StatCard label="Critical" value={critical} accent={critical > 0 ? 'text-rose-300' : 'text-emerald-300'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Tonnage by category" />
          <div className="space-y-3 px-5 pb-5">
            {tonnageByCategory.map((t) => (
              <div key={t.cat}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{titleCase(t.cat)}</span>
                  <span>{fmtWeight(t.kg)}</span>
                </div>
                <ProgressBar value={t.ratio} className="bg-amber-400" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Priority mix" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5">
            {(['critical', 'high', 'standard', 'low'] as const).map((p) => (
              <div key={p} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <Badge className={priorityColor[p]}>{titleCase(p)}</Badge>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{byPriority[p] ?? 0}</p>
                <p className="text-xs text-slate-400">shipments</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Shipments"
          subtitle="Cargo manifest"
          action={
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as CargoCategory | 'all')}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </select>
          }
        />
        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-medium">AWB</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Weight</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Flight</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.slice(0, 40).map((c) => (
                <tr key={c.id} className="text-slate-300 hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-slate-100">{c.awb}</td>
                  <td className="px-3 py-2">{c.description}</td>
                  <td className="px-3 py-2 text-slate-400">{titleCase(c.category)}</td>
                  <td className="px-3 py-2">{fmtWeight(c.weightKg)}</td>
                  <td className="px-3 py-2">
                    <Badge className={priorityColor[c.priority]}>{titleCase(c.priority)}</Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    {c.flightId ? flightByCargo.get(c.flightId) ?? '—' : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={cargoStatusColor[c.status]}>{titleCase(c.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
