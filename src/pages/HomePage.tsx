import { useState } from 'react';

import { CargoTab } from '@/components/dashboard/CargoTab';
import { FleetTab } from '@/components/dashboard/FleetTab';
import { GatesTab } from '@/components/dashboard/GatesTab';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { PredictionsTab } from '@/components/dashboard/PredictionsTab';
import { WorkforceTab } from '@/components/dashboard/WorkforceTab';
import { fmtClock } from '@/components/dashboard/primitives';
import { useAirportData } from '@/hooks/useAirportData';
import { useAuth } from '@/hooks/AuthContext';

const WEATHER_ICON: Record<string, string> = {
  clear: '☀️',
  cloudy: '⛅',
  rain: '🌧️',
  snow: '❄️',
  fog: '🌫️',
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'gates', label: 'Gates' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'cargo', label: 'Cargo' },
  { id: 'workforce', label: 'Workforce' },
  { id: 'predictions', label: 'Predictions' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function HomePage() {
  const { user, signOut } = useAuth();
  const { data, disruptions, allocations, clock } = useAirportData();
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-lg shadow-lg shadow-sky-500/20">
              ✈️
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white">
                AeroOps <span className="text-slate-500">·</span> Logistics Command
              </h1>
              <p className="text-xs text-slate-400">AERO International · Live operations</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-1.5 sm:flex">
              <span className="text-lg leading-none">{WEATHER_ICON[data.conditions.condition]}</span>
              <span className="text-xs text-slate-300">
                {data.conditions.visibilityKm} km · {data.conditions.windKt} kt
              </span>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-slate-100">{fmtClock(clock)}</div>
              <div className="text-[11px] text-slate-500">
                {clock.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })}
              </div>
            </div>
            <div className="hidden text-right md:block">
              <div className="text-xs text-slate-300">{user?.name ?? 'Operator'}</div>
              <button
                onClick={() => void signOut()}
                className="text-[11px] text-slate-500 transition-colors hover:text-sky-400"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-sky-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5">
        {tab === 'overview' && (
          <OverviewTab data={data} disruptions={disruptions} allocations={allocations} />
        )}
        {tab === 'gates' && <GatesTab data={data} />}
        {tab === 'fleet' && <FleetTab data={data} />}
        {tab === 'cargo' && <CargoTab data={data} />}
        {tab === 'workforce' && <WorkforceTab data={data} />}
        {tab === 'predictions' && (
          <PredictionsTab data={data} disruptions={disruptions} allocations={allocations} />
        )}
      </main>
    </div>
  );
}
