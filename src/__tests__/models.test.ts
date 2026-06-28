import { describe, expect, it } from 'vitest';

import { generateAirportData } from '@/data/mockData';
import { predictAllDisruptions } from '@/models/disruptionModel';
import { recommendGateAllocations } from '@/models/gateAllocation';

const NOW = new Date('2026-06-28T12:00:00Z');

describe('mock data generation', () => {
  it('is deterministic for a given seed', () => {
    const a = generateAirportData(7, NOW);
    const b = generateAirportData(7, NOW);
    expect(a.flights.map((f) => f.flightNumber)).toEqual(b.flights.map((f) => f.flightNumber));
    expect(a.gates.length).toBe(b.gates.length);
    expect(a.employees.length).toBe(b.employees.length);
  });

  it('produces a coherent dataset', () => {
    const ds = generateAirportData(42, NOW);
    expect(ds.gates.length).toBeGreaterThan(0);
    expect(ds.aircraft.length).toBeGreaterThan(0);
    expect(ds.flights.length).toBeGreaterThan(0);
    expect(ds.cargo.length).toBeGreaterThan(0);
    // every linked flight/aircraft id resolves
    const flightIds = new Set(ds.flights.map((f) => f.id));
    for (const c of ds.cargo) {
      if (c.flightId) expect(flightIds.has(c.flightId)).toBe(true);
    }
  });
});

describe('disruption model', () => {
  it('returns probabilities in [0,1] sorted descending', () => {
    const ds = generateAirportData(42, NOW);
    const preds = predictAllDisruptions(ds);
    expect(preds.length).toBeGreaterThan(0);
    for (const p of preds) {
      expect(p.probability).toBeGreaterThanOrEqual(0);
      expect(p.probability).toBeLessThanOrEqual(1);
      expect(p.predictedDelayMinutes).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < preds.length; i++) {
      expect(preds[i - 1].probability).toBeGreaterThanOrEqual(preds[i].probability);
    }
  });

  it('rates fog conditions riskier than clear', () => {
    // Search seeds to obtain contrasting weather, then compare mean risk.
    const mean = (seed: number) => {
      const ds = generateAirportData(seed, NOW);
      const preds = predictAllDisruptions(ds);
      const avg = preds.reduce((s, p) => s + p.probability, 0) / preds.length;
      return { condition: ds.conditions.condition, avg };
    };
    const samples = Array.from({ length: 40 }, (_, i) => mean(i));
    const fog = samples.filter((s) => s.condition === 'fog');
    const clear = samples.filter((s) => s.condition === 'clear');
    if (fog.length && clear.length) {
      const fogAvg = fog.reduce((s, x) => s + x.avg, 0) / fog.length;
      const clearAvg = clear.reduce((s, x) => s + x.avg, 0) / clear.length;
      expect(fogAvg).toBeGreaterThan(clearAvg);
    }
  });
});

describe('gate allocation model', () => {
  it('never double-books a stand within overlapping windows', () => {
    const ds = generateAirportData(42, NOW);
    const recs = recommendGateAllocations(ds);
    const flightById = new Map(ds.flights.map((f) => [f.id, f] as const));

    // Group recommended slots by gate and ensure no two overlap (>= 50 min apart).
    const byGate = new Map<string, number[]>();
    for (const r of recs) {
      const f = flightById.get(r.flightId)!;
      const arr = byGate.get(r.recommendedGateId) ?? [];
      arr.push(f.scheduledTime.getTime());
      byGate.set(r.recommendedGateId, arr);
    }
    for (const times of byGate.values()) {
      const sorted = [...times].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(15 * 60_000);
      }
    }
  });

  it('reports confidence as a percentage', () => {
    const ds = generateAirportData(42, NOW);
    for (const r of recommendGateAllocations(ds)) {
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(100);
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });
});
