import { useState } from 'react';

import { AirportMap } from '@/components/dashboard/AirportMap';
import {
  Badge,
  Card,
  ProgressBar,
  SectionTitle,
  StatCard,
  fmtTime,
  flightStatusColor,
  gateStatusColor,
  riskColor,
  titleCase,
} from '@/components/dashboard/primitives';
import type {
  AirportDataset,
  DisruptionPrediction,
  GateAllocationRecommendation,
} from '@/domain/types';
import { computeOverviewKpis } from '@/domain/metrics';

const WEATHER_ICON: Record<string, string> = {
  clear: '☀️',
  cloudy: '⛅',
  rain: '🌧️',
  snow: '❄️',
  fog: '🌫️',
};

function MapLegend() {
  const items = [
    { label: 'Available', color: '#34d399' },
    { label: 'Occupied', color: '#38bdf8' },
    { label: 'Maintenance', color: '#fbbf24' },
  ];
  return (
    <div className="flex items-center gap-4">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function GateDetail({
  data,
  gateId,
}: {
  data: AirportDataset;
  gateId: string;
}) {
  const gate = data.gates.find((g) => g.id === gateId);
  if (!gate) return null;
  const flights = data.flights
    .filter((f) => f.gateId === gateId && f.status !== 'departed' && f.status !== 'landed')
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

  return (
    <div className="border-t border-slate-700/60 px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-semibold text-slate-100">Gate {gate.code}</span>
          <Badge className={gateStatusColor[gate.status]}>{titleCase(gate.status)}</Badge>
        </div>
        <span className="text-xs text-slate-400">
          {gate.terminal} · {titleCase(gate.gateType)} · {gate.hasJetBridge ? 'Jet bridge' : 'Bus boarding'}
        </span>
      </div>
      {flights.length > 0 ? (
        <div className="mt-2 space-y-1">
          {flights.slice(0, 3).map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm">
              <span className="font-mono text-slate-200">{f.flightNumber}</span>
              <span className="text-slate-400">
                {f.direction === 'arrival' ? `from ${f.origin}` : `to ${f.destination}`}
              </span>
              <span className="text-slate-300">{fmtTime(f.scheduledTime)}</span>
              <Badge className={flightStatusColor[f.status]}>{titleCase(f.status)}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No active flights assigned to this stand.</p>
      )}
    </div>
  );
}

export function OverviewTab({
  data,
  disruptions,
  allocations,
}: {
  data: AirportDataset;
  disruptions: DisruptionPrediction[];
  allocations: GateAllocationRecommendation[];
}) {
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const k = computeOverviewKpis(data, disruptions);
  const c = data.conditions;
  const topRisks = disruptions.slice(0, 5);
  const reassignments = allocations.filter((a) => a.isReassignment).length;

  const board = data.flights
    .filter((f) => f.status !== 'departed' && f.status !== 'landed')
    .slice(0, 9);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active flights" value={k.activeFlights} hint={`${k.totalFlights} scheduled today`} accent="text-sky-300" />
        <StatCard label="On-time" value={`${k.onTimePct}%`} hint={`${k.delayedCount} delayed · ${k.cancelledCount} cancelled`} accent="text-emerald-300" />
        <StatCard label="Gates in use" value={`${k.gatesOccupied}/${k.gatesTotal}`} hint={`${k.gatesAvailable} free · ${k.gatesMaintenance} maint.`} accent="text-indigo-300" />
        <StatCard label="Staff on duty" value={k.staffOnDuty} hint={`of ${k.staffTotal} total`} accent="text-violet-300" />
        <StatCard label="Cargo today" value={`${k.cargoTonnage} t`} hint={`${k.cargoCritical} critical shipments`} accent="text-amber-300" />
        <StatCard label="At-risk flights" value={k.highRiskFlights} hint="high / severe risk" accent={k.highRiskFlights > 0 ? 'text-rose-300' : 'text-emerald-300'} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <SectionTitle
            title="Airfield map"
            subtitle="Live stand occupancy · click a gate for detail"
            action={<MapLegend />}
          />
          <div className="aspect-[1000/640] w-full bg-slate-900/40">
            <AirportMap data={data} selectedGateId={selectedGate} onSelectGate={setSelectedGate} />
          </div>
          {selectedGate && <GateDetail data={data} gateId={selectedGate} />}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Conditions</p>
                <p className="mt-1 text-xl font-semibold text-slate-100">{titleCase(c.condition)}</p>
              </div>
              <span className="text-4xl">{WEATHER_ICON[c.condition]}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-slate-100">{c.visibilityKm}</p>
                <p className="text-[11px] text-slate-400">Vis. km</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-100">{c.windKt}</p>
                <p className="text-[11px] text-slate-400">Wind kt</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-100">{Math.round(c.congestion * 100)}%</p>
                <p className="text-[11px] text-slate-400">Congestion</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Disruption radar"
              subtitle="Model-ranked delay risk"
              action={
                <Badge className={riskColor.high}>{k.highRiskFlights} at risk</Badge>
              }
            />
            <div className="space-y-2 px-5 pb-4">
              {topRisks.map((d) => (
                <div key={d.flightId} className="flex items-center gap-3">
                  <span className="w-14 font-mono text-sm text-slate-200">{d.flightNumber}</span>
                  <div className="flex-1">
                    <ProgressBar
                      value={d.probability}
                      className={
                        d.riskLevel === 'severe'
                          ? 'bg-rose-400'
                          : d.riskLevel === 'high'
                            ? 'bg-orange-400'
                            : d.riskLevel === 'moderate'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                      }
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-slate-400">
                    {Math.round(d.probability * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Gate optimizer</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">{allocations.length}</p>
            <p className="text-xs text-slate-400">
              recommendations · {reassignments} reassignments suggested
            </p>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Flight board" subtitle="Next arrivals & departures" />
        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-medium">Flight</th>
                <th className="px-3 py-2 font-medium">Airline</th>
                <th className="px-3 py-2 font-medium">Dir</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Sched</th>
                <th className="px-3 py-2 font-medium">Gate</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {board.map((f) => {
                const gate = data.gates.find((g) => g.id === f.gateId);
                return (
                  <tr key={f.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-mono text-slate-100">{f.flightNumber}</td>
                    <td className="px-3 py-2">{f.airline}</td>
                    <td className="px-3 py-2">{f.direction === 'arrival' ? '⬇ Arr' : '⬆ Dep'}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {f.direction === 'arrival' ? f.origin : f.destination}
                    </td>
                    <td className="px-3 py-2">{fmtTime(f.scheduledTime)}</td>
                    <td className="px-3 py-2 font-mono">{gate?.code ?? '—'}</td>
                    <td className="px-3 py-2">
                      <Badge className={flightStatusColor[f.status]}>{titleCase(f.status)}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
