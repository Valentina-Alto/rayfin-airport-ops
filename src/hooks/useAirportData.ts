import { useEffect, useMemo, useState } from 'react';

import { generateAirportData } from '@/data/mockData';
import type {
  AirportDataset,
  DisruptionPrediction,
  GateAllocationRecommendation,
} from '@/domain/types';
import { recommendGateAllocations } from '@/models/gateAllocation';
import { predictAllDisruptions } from '@/models/disruptionModel';

export interface AirportDataResult {
  data: AirportDataset;
  disruptions: DisruptionPrediction[];
  allocations: GateAllocationRecommendation[];
  /** Live ticking clock for the header. */
  clock: Date;
}

/**
 * Generates the demo dataset once (stable for the session) and derives the
 * predictive model outputs from it. A lightweight clock ticks every second so
 * the UI feels live without regenerating data.
 */
export function useAirportData(seed = 42): AirportDataResult {
  const data = useMemo(() => generateAirportData(seed, new Date()), [seed]);

  const disruptions = useMemo(() => predictAllDisruptions(data), [data]);
  const allocations = useMemo(() => recommendGateAllocations(data), [data]);

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return { data, disruptions, allocations, clock };
}
