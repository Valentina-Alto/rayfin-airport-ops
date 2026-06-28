import { useMemo, useState } from 'react';

import {
  Badge,
  Card,
  ProgressBar,
  SectionTitle,
  StatCard,
  departmentColor,
  employeeStatusColor,
  titleCase,
} from '@/components/dashboard/primitives';
import type { Department, AirportDataset, Shift } from '@/domain/types';
import { groupCount } from '@/domain/metrics';

const DEPARTMENTS: Department[] = [
  'ground_ops',
  'security',
  'cargo',
  'maintenance',
  'customer_service',
  'fuel',
];
const SHIFTS: Shift[] = ['morning', 'afternoon', 'night'];

export function WorkforceTab({ data }: { data: AirportDataset }) {
  const [filter, setFilter] = useState<Department | 'all'>('all');

  const onDuty = data.employees.filter((e) => e.status === 'on_duty').length;
  const onBreak = data.employees.filter((e) => e.status === 'on_break').length;

  const byDept = useMemo(() => {
    const counts = groupCount(data.employees, (e) => e.department);
    const max = Math.max(1, ...Object.values(counts));
    return DEPARTMENTS.map((d) => ({ dept: d, count: counts[d] ?? 0, ratio: (counts[d] ?? 0) / max }));
  }, [data]);

  const byShift = groupCount(data.employees, (e) => e.shift);
  const rows = data.employees.filter((e) => filter === 'all' || e.department === filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total staff" value={data.employees.length} accent="text-violet-300" />
        <StatCard label="On duty" value={onDuty} accent="text-emerald-300" />
        <StatCard label="On break" value={onBreak} accent="text-amber-300" />
        <StatCard label="Departments" value={DEPARTMENTS.length} accent="text-sky-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Headcount by department" />
          <div className="space-y-3 px-5 pb-5">
            {byDept.map((d) => (
              <div key={d.dept}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${departmentColor[d.dept]}`} />
                    {titleCase(d.dept)}
                  </span>
                  <span>{d.count}</span>
                </div>
                <ProgressBar value={d.ratio} className={departmentColor[d.dept]} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Shift coverage" />
          <div className="grid grid-cols-3 gap-3 px-5 pb-5">
            {SHIFTS.map((s) => (
              <div key={s} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-400">{titleCase(s)}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{byShift[s] ?? 0}</p>
                <p className="text-xs text-slate-400">assigned</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Roster"
          subtitle="Staff on shift"
          action={
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Department | 'all')}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {titleCase(d)}
                </option>
              ))}
            </select>
          }
        />
        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Zone</th>
                <th className="px-3 py-2 font-medium">Shift</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.slice(0, 40).map((e) => (
                <tr key={e.id} className="text-slate-300 hover:bg-slate-800/40">
                  <td className="px-3 py-2 text-slate-100">{e.fullName}</td>
                  <td className="px-3 py-2">{e.role}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 text-slate-400">
                      <span className={`h-2 w-2 rounded-full ${departmentColor[e.department]}`} />
                      {titleCase(e.department)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{e.zone}</td>
                  <td className="px-3 py-2">{titleCase(e.shift)}</td>
                  <td className="px-3 py-2">
                    <Badge className={employeeStatusColor[e.status]}>{titleCase(e.status)}</Badge>
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
