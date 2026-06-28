import type { ReactNode } from 'react';

import type {
  AircraftStatus,
  CargoPriority,
  CargoStatus,
  Department,
  EmployeeStatus,
  FlightStatus,
  GateStatus,
  RiskLevel,
} from '@/domain/types';

// ---- formatting -------------------------------------------------------------------

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function fmtClock(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function fmtWeight(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg} kg`;
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- color tokens -----------------------------------------------------------------

export const flightStatusColor: Record<FlightStatus, string> = {
  on_time: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  delayed: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
  boarding: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  departed: 'text-slate-300 bg-slate-500/15 ring-slate-500/30',
  landed: 'text-slate-300 bg-slate-500/15 ring-slate-500/30',
  cancelled: 'text-rose-300 bg-rose-500/15 ring-rose-500/30',
};

export const gateStatusColor: Record<GateStatus, string> = {
  available: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  occupied: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  maintenance: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
};

export const aircraftStatusColor: Record<AircraftStatus, string> = {
  in_service: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  boarding: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  taxiing: 'text-indigo-300 bg-indigo-500/15 ring-indigo-500/30',
  airborne: 'text-violet-300 bg-violet-500/15 ring-violet-500/30',
  maintenance: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
};

export const employeeStatusColor: Record<EmployeeStatus, string> = {
  on_duty: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  on_break: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
  off_duty: 'text-slate-300 bg-slate-500/15 ring-slate-500/30',
};

export const cargoStatusColor: Record<CargoStatus, string> = {
  booked: 'text-slate-300 bg-slate-500/15 ring-slate-500/30',
  received: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  screening: 'text-violet-300 bg-violet-500/15 ring-violet-500/30',
  loading: 'text-indigo-300 bg-indigo-500/15 ring-indigo-500/30',
  loaded: 'text-cyan-300 bg-cyan-500/15 ring-cyan-500/30',
  in_transit: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
  delivered: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
};

export const priorityColor: Record<CargoPriority, string> = {
  low: 'text-slate-300 bg-slate-500/15 ring-slate-500/30',
  standard: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  high: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
  critical: 'text-rose-300 bg-rose-500/15 ring-rose-500/30',
};

export const riskColor: Record<RiskLevel, string> = {
  low: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  moderate: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
  high: 'text-orange-300 bg-orange-500/15 ring-orange-500/30',
  severe: 'text-rose-300 bg-rose-500/15 ring-rose-500/30',
};

export const departmentColor: Record<Department, string> = {
  ground_ops: 'bg-sky-400',
  security: 'bg-violet-400',
  cargo: 'bg-amber-400',
  maintenance: 'bg-rose-400',
  customer_service: 'bg-emerald-400',
  fuel: 'bg-cyan-400',
};

// ---- primitives -------------------------------------------------------------------

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = 'text-slate-100',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </Card>
  );
}

export function ProgressBar({
  value,
  className = 'bg-sky-400',
  track = 'bg-slate-700/60',
}: {
  value: number; // 0..1
  className?: string;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${track}`}>
      <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
