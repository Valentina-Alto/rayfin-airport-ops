import { useMemo, useState } from 'react';

import {
  Badge,
  Card,
  SectionTitle,
  StatCard,
  aircraftStatusColor,
  titleCase,
  fmtWeight,
} from '@/components/dashboard/primitives';
import type { AircraftStatus, AirportDataset } from '@/domain/types';
import { groupCount } from '@/domain/metrics';

const STATUSES: AircraftStatus[] = [
  'in_service',
  'boarding',
  'taxiing',
  'airborne',
  'maintenance',
];

export function FleetTab({ data }: { data: AirportDataset }) {
  const [filter, setFilter] = useState<AircraftStatus | 'all'>('all');
  const byStatus = groupCount(data.aircraft, (a) => a.status);

  // Which flight each aircraft is currently operating.
  const flightByAircraft = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of data.flights) {
      if (f.aircraftId && f.status !== 'departed' && f.status !== 'landed') {
        if (!m.has(f.aircraftId)) m.set(f.aircraftId, f.flightNumber);
      }
    }
    return m;
  }, [data]);

  const rows = data.aircraft.filter((a) => filter === 'all' || a.status === filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Fleet size" value={data.aircraft.length} accent="text-sky-300" />
        {STATUSES.map((s) => (
          <StatCard
            key={s}
            label={titleCase(s)}
            value={byStatus[s] ?? 0}
            accent="text-slate-100"
          />
        ))}
      </div>

      <Card>
        <SectionTitle
          title="Fleet status"
          subtitle="Aircraft and current assignment"
          action={
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as AircraftStatus | 'all')}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          }
        />
        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-medium">Reg.</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Airline</th>
                <th className="px-3 py-2 font-medium">Body</th>
                <th className="px-3 py-2 font-medium">Seats</th>
                <th className="px-3 py-2 font-medium">Cargo cap.</th>
                <th className="px-3 py-2 font-medium">Flight</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((a) => (
                <tr key={a.id} className="text-slate-300 hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-slate-100">{a.registration}</td>
                  <td className="px-3 py-2">{a.model}</td>
                  <td className="px-3 py-2 text-slate-400">{a.airline}</td>
                  <td className="px-3 py-2">{titleCase(a.bodyType)}</td>
                  <td className="px-3 py-2">{a.seatCapacity || '—'}</td>
                  <td className="px-3 py-2">{fmtWeight(a.cargoCapacityKg)}</td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    {flightByAircraft.get(a.id) ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={aircraftStatusColor[a.status]}>{titleCase(a.status)}</Badge>
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
