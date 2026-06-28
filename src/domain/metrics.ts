import type {
  AirportDataset,
  DisruptionPrediction,
  Flight,
} from '@/domain/types';

export interface OverviewKpis {
  totalFlights: number;
  activeFlights: number;
  onTimePct: number;
  delayedCount: number;
  cancelledCount: number;
  gatesOccupied: number;
  gatesTotal: number;
  gatesAvailable: number;
  gatesMaintenance: number;
  staffOnDuty: number;
  staffTotal: number;
  cargoTonnage: number;
  cargoCritical: number;
  aircraftActive: number;
  highRiskFlights: number;
}

function isActive(f: Flight): boolean {
  return f.status !== 'departed' && f.status !== 'landed' && f.status !== 'cancelled';
}

export function computeOverviewKpis(
  data: AirportDataset,
  disruptions: DisruptionPrediction[]
): OverviewKpis {
  const flights = data.flights;
  const resolved = flights.filter((f) => f.status !== 'cancelled');
  const onTime = resolved.filter((f) => f.status === 'on_time' || f.status === 'boarding').length;

  const cargoTonnage =
    data.cargo.reduce((s, c) => s + c.weightKg, 0) / 1000;

  return {
    totalFlights: flights.length,
    activeFlights: flights.filter(isActive).length,
    onTimePct: resolved.length ? Math.round((onTime / resolved.length) * 100) : 0,
    delayedCount: flights.filter((f) => f.status === 'delayed').length,
    cancelledCount: flights.filter((f) => f.status === 'cancelled').length,
    gatesOccupied: data.gates.filter((g) => g.status === 'occupied').length,
    gatesTotal: data.gates.length,
    gatesAvailable: data.gates.filter((g) => g.status === 'available').length,
    gatesMaintenance: data.gates.filter((g) => g.status === 'maintenance').length,
    staffOnDuty: data.employees.filter((e) => e.status === 'on_duty').length,
    staffTotal: data.employees.length,
    cargoTonnage: Math.round(cargoTonnage * 10) / 10,
    cargoCritical: data.cargo.filter((c) => c.priority === 'critical').length,
    aircraftActive: data.aircraft.filter((a) => a.status !== 'maintenance').length,
    highRiskFlights: disruptions.filter(
      (d) => d.riskLevel === 'high' || d.riskLevel === 'severe'
    ).length,
  };
}

export function groupCount<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, number> {
  return items.reduce(
    (acc, item) => {
      const k = keyFn(item);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<K, number>
  );
}
