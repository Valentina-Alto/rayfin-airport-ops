import type {
  Aircraft,
  AirportDataset,
  Flight,
  Gate,
  GateAllocationRecommendation,
} from '@/domain/types';

// Greedy, constraint-aware gate allocation optimizer.
//
// For each flight that needs a stand within the planning window it scores every
// feasible gate and assigns the best one, maintaining a per-gate occupancy
// schedule so two flights never overlap on the same stand. Scoring blends
// hard constraints (size, availability, conflicts) with soft preferences
// (jet bridge, terminal affinity, contact-stand utilisation).

const OCCUPANCY_BEFORE_MIN = 20;
const OCCUPANCY_AFTER_MIN: Record<Aircraft['bodyType'], number> = {
  regional: 35,
  narrow: 45,
  wide: 70,
};

interface Interval {
  start: number;
  end: number;
}

function sizeCompatible(gate: Gate, ac?: Aircraft): boolean {
  if (!ac) return true;
  if (gate.maxAircraftSize === 'any') return true;
  if (gate.maxAircraftSize === 'wide') return true; // wide stands take anything
  // narrow stand: only regional/narrow
  return ac.bodyType !== 'wide';
}

function isCargoAircraft(ac?: Aircraft): boolean {
  return !!ac && ac.seatCapacity === 0;
}

function occupancyWindow(flight: Flight, ac?: Aircraft): Interval {
  const slot = flight.scheduledTime.getTime();
  const after = OCCUPANCY_AFTER_MIN[ac?.bodyType ?? 'narrow'];
  return {
    start: slot - OCCUPANCY_BEFORE_MIN * 60_000,
    end: slot + after * 60_000,
  };
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

function scoreGate(
  gate: Gate,
  flight: Flight,
  ac: Aircraft | undefined,
  airlineTerminal: Map<string, string>
): { score: number; reasons: string[] } | null {
  if (gate.status === 'maintenance') return null;
  if (!sizeCompatible(gate, ac)) return null;

  const cargo = isCargoAircraft(ac);
  if (cargo && gate.gateType !== 'cargo') return null;
  if (!cargo && gate.gateType === 'cargo') return null;

  const reasons: string[] = [];
  let score = 50;

  // Size fit — reward using the smallest stand that fits (don't waste wide stands).
  if (ac?.bodyType === 'wide' && gate.maxAircraftSize === 'wide') {
    score += 18;
    reasons.push('Wide-body stand matches aircraft');
  } else if (ac && ac.bodyType !== 'wide' && gate.maxAircraftSize === 'narrow') {
    score += 12;
    reasons.push('Right-sized narrow-body stand');
  } else if (ac && ac.bodyType !== 'wide' && gate.maxAircraftSize === 'wide') {
    score -= 6;
    reasons.push('Wide stand used for narrow-body (suboptimal)');
  }

  // Jet bridge for passenger flights.
  if (!cargo && flight.passengerCount > 0) {
    if (gate.hasJetBridge) {
      score += 14;
      reasons.push('Jet bridge for passenger comfort');
    } else {
      score -= 10;
      reasons.push('Remote stand — bus boarding required');
    }
  }
  if (cargo && gate.gateType === 'cargo') {
    score += 16;
    reasons.push('Dedicated cargo apron');
  }

  // Terminal/airline affinity — keep an airline's ops clustered.
  const preferred = airlineTerminal.get(flight.airline);
  if (preferred && gate.terminal === preferred) {
    score += 10;
    reasons.push(`Keeps ${flight.airline} in ${gate.terminal}`);
  }

  // Contact stands preferred for tight turnarounds at peak.
  if (gate.gateType === 'contact') {
    score += 5;
  }

  return { score, reasons };
}

export function recommendGateAllocations(
  ds: AirportDataset,
  options: { windowHours?: number } = {}
): GateAllocationRecommendation[] {
  const windowMs = (options.windowHours ?? 6) * 3600_000;
  const aircraftById = new Map(ds.aircraft.map((a) => [a.id, a] as const));
  const gateById = new Map(ds.gates.map((g) => [g.id, g] as const));

  // Establish each airline's dominant terminal from existing assignments.
  const airlineTerminal = new Map<string, string>();
  const terminalTally = new Map<string, Map<string, number>>();
  for (const f of ds.flights) {
    if (!f.gateId) continue;
    const g = gateById.get(f.gateId);
    if (!g) continue;
    const tally = terminalTally.get(f.airline) ?? new Map<string, number>();
    tally.set(g.terminal, (tally.get(g.terminal) ?? 0) + 1);
    terminalTally.set(f.airline, tally);
  }
  for (const [airline, tally] of terminalTally) {
    const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) airlineTerminal.set(airline, best[0]);
  }

  // Flights that need planning: active, within the window.
  const candidates = ds.flights
    .filter((f) => f.status !== 'departed' && f.status !== 'landed' && f.status !== 'cancelled')
    .filter((f) => {
      const dt = f.scheduledTime.getTime() - ds.now.getTime();
      return dt > -45 * 60_000 && dt < windowMs;
    })
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

  const occupancy = new Map<string, Interval[]>();
  const recommendations: GateAllocationRecommendation[] = [];

  for (const flight of candidates) {
    const ac = flight.aircraftId ? aircraftById.get(flight.aircraftId) : undefined;
    const window = occupancyWindow(flight, ac);

    let best: { gate: Gate; score: number; reasons: string[] } | null = null;
    for (const gate of ds.gates) {
      const busy = occupancy.get(gate.id) ?? [];
      if (busy.some((iv) => overlaps(iv, window))) continue; // conflict
      const scored = scoreGate(gate, flight, ac, airlineTerminal);
      if (!scored) continue;
      if (!best || scored.score > best.score) {
        best = { gate, score: scored.score, reasons: scored.reasons };
      }
    }

    if (!best) continue;

    const busy = occupancy.get(best.gate.id) ?? [];
    busy.push(window);
    occupancy.set(best.gate.id, busy);

    const currentGate = flight.gateId ? gateById.get(flight.gateId) : undefined;
    const confidence = Math.max(5, Math.min(99, Math.round((best.score / 110) * 100)));

    recommendations.push({
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      direction: flight.direction,
      recommendedGateId: best.gate.id,
      recommendedGateCode: best.gate.code,
      confidence,
      score: Math.round(best.score),
      reasons: best.reasons.slice(0, 3),
      isReassignment: !!currentGate && currentGate.id !== best.gate.id,
      currentGateCode: currentGate?.code,
    });
  }

  return recommendations;
}
