import type {
  AirportDataset,
  Aircraft,
  DisruptionPrediction,
  Flight,
  OpsConditions,
  RiskLevel,
} from '@/domain/types';

// A transparent logistic-regression-style disruption model. Each feature
// contributes a weighted term to a logit; the sigmoid maps it to a 0..1
// probability of a material disruption (>= 15 min delay or cancellation).
// Weights are hand-tuned to behave like a model trained on historical ops data.

const WEIGHTS = {
  bias: -2.1,
  existingDelay: 0.06, // per minute of current delay
  weatherSeverity: 1.9, // 0..1
  lowVisibility: 1.4, // 0..1 (worse as visibility drops)
  highWind: 1.1, // 0..1
  congestion: 1.6, // 0..1
  turnaroundLoad: 0.9, // 0..1 (wide-body / high pax)
  noGate: 0.8, // 1 if unassigned close to slot
  peakBank: 0.7, // 1 during peak departure/arrival banks
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function weatherSeverity(c: OpsConditions): number {
  switch (c.condition) {
    case 'fog':
      return 0.95;
    case 'snow':
      return 0.85;
    case 'rain':
      return 0.5;
    case 'cloudy':
      return 0.2;
    default:
      return 0.05;
  }
}

function visibilityFactor(c: OpsConditions): number {
  // 10km+ -> 0, 0km -> 1
  return Math.max(0, Math.min(1, (10 - c.visibilityKm) / 10));
}

function windFactor(c: OpsConditions): number {
  // Calm below 12kt, fully adverse at 35kt+.
  return Math.max(0, Math.min(1, (c.windKt - 12) / 23));
}

function turnaroundLoad(ac?: Aircraft, pax = 0): number {
  if (!ac) return 0.3;
  const bodyLoad = ac.bodyType === 'wide' ? 0.9 : ac.bodyType === 'narrow' ? 0.5 : 0.3;
  const paxLoad = ac.seatCapacity > 0 ? pax / ac.seatCapacity : 0.4;
  return Math.max(0, Math.min(1, bodyLoad * 0.6 + paxLoad * 0.4));
}

function isPeakBank(scheduled: Date): boolean {
  const h = scheduled.getHours();
  return (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
}

function riskLevel(p: number): RiskLevel {
  if (p >= 0.7) return 'severe';
  if (p >= 0.45) return 'high';
  if (p >= 0.22) return 'moderate';
  return 'low';
}

export function predictDisruption(
  flight: Flight,
  ds: AirportDataset
): DisruptionPrediction {
  const ac = ds.aircraft.find((a) => a.id === flight.aircraftId);
  const existingDelayMin = Math.max(
    0,
    (flight.estimatedTime.getTime() - flight.scheduledTime.getTime()) / 60_000
  );
  const minutesToSlot = (flight.scheduledTime.getTime() - ds.now.getTime()) / 60_000;
  const noGate = !flight.gateId && minutesToSlot < 90 && minutesToSlot > -30 ? 1 : 0;

  const f = {
    existingDelay: existingDelayMin,
    weatherSeverity: weatherSeverity(ds.conditions),
    lowVisibility: visibilityFactor(ds.conditions),
    highWind: windFactor(ds.conditions),
    congestion: ds.conditions.congestion,
    turnaroundLoad: turnaroundLoad(ac, flight.passengerCount),
    noGate,
    peakBank: isPeakBank(flight.scheduledTime) ? 1 : 0,
  };

  const terms: { key: keyof typeof WEIGHTS; label: string; value: number }[] = [
    { key: 'existingDelay', label: 'Current delay', value: WEIGHTS.existingDelay * f.existingDelay },
    { key: 'weatherSeverity', label: 'Weather', value: WEIGHTS.weatherSeverity * f.weatherSeverity },
    { key: 'lowVisibility', label: 'Low visibility', value: WEIGHTS.lowVisibility * f.lowVisibility },
    { key: 'highWind', label: 'Crosswind', value: WEIGHTS.highWind * f.highWind },
    { key: 'congestion', label: 'Airfield congestion', value: WEIGHTS.congestion * f.congestion },
    { key: 'turnaroundLoad', label: 'Turnaround load', value: WEIGHTS.turnaroundLoad * f.turnaroundLoad },
    { key: 'noGate', label: 'No gate assigned', value: WEIGHTS.noGate * f.noGate },
    { key: 'peakBank', label: 'Peak bank', value: WEIGHTS.peakBank * f.peakBank },
  ];

  const logit = WEIGHTS.bias + terms.reduce((s, t) => s + t.value, 0);
  let probability = sigmoid(logit);

  // Already-resolved flights collapse toward certainty / zero.
  if (flight.status === 'cancelled') probability = 1;
  if (flight.status === 'departed' || flight.status === 'landed') {
    probability = existingDelayMin >= 15 ? 1 : 0.02;
  }

  const predictedDelayMinutes = Math.round(
    Math.max(existingDelayMin, probability * 70 + existingDelayMin * 0.5)
  );

  const topFactors = terms
    .filter((t) => t.value > 0.05)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((t) => ({ label: t.label, weight: Math.round(t.value * 100) / 100 }));

  return {
    flightId: flight.id,
    flightNumber: flight.flightNumber,
    airline: flight.airline,
    direction: flight.direction,
    probability: Math.round(probability * 1000) / 1000,
    predictedDelayMinutes,
    riskLevel: riskLevel(probability),
    topFactors,
  };
}

/** Predict disruption for every active flight, highest risk first. */
export function predictAllDisruptions(ds: AirportDataset): DisruptionPrediction[] {
  return ds.flights
    .filter((f) => f.status !== 'departed' && f.status !== 'landed')
    .map((f) => predictDisruption(f, ds))
    .sort((a, b) => b.probability - a.probability);
}
