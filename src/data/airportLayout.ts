import type { AircraftSize, GateType } from '@/domain/types';

// The map is drawn in a fixed SVG coordinate space. All geometry below is
// expressed in these units and scaled responsively by the AirportMap component.
export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 640;

export interface TerminalShape {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RunwayShape {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BuildingShape {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'tower' | 'cargo' | 'service';
}

export interface GateBlueprint {
  code: string;
  terminal: string;
  gateType: GateType;
  maxAircraftSize: AircraftSize;
  hasJetBridge: boolean;
  x: number;
  y: number;
}

export const TERMINALS: TerminalShape[] = [
  { id: 'T1', label: 'Terminal 1', x: 250, y: 150, width: 500, height: 60 },
  { id: 'T1-pierA', label: 'Pier A', x: 250, y: 90, width: 60, height: 120 },
  { id: 'T1-pierB', label: 'Pier B', x: 690, y: 90, width: 60, height: 120 },
  { id: 'T2', label: 'Terminal 2', x: 300, y: 420, width: 400, height: 60 },
];

export const RUNWAYS: RunwayShape[] = [
  { id: 'RWY-09L/27R', label: '09L / 27R', x: 60, y: 40, width: 880, height: 26 },
  { id: 'RWY-09R/27L', label: '09R / 27L', x: 60, y: 560, width: 880, height: 26 },
];

export const BUILDINGS: BuildingShape[] = [
  { id: 'twr', label: 'TWR', x: 478, y: 250, width: 44, height: 44, kind: 'tower' },
  { id: 'cargo', label: 'Cargo City', x: 770, y: 300, width: 170, height: 120, kind: 'cargo' },
  { id: 'svc', label: 'Maint.', x: 60, y: 300, width: 130, height: 110, kind: 'service' },
];

// Dashed taxiway centerlines connecting aprons to the runways.
export const TAXIWAYS: string[] = [
  'M 120 95 L 120 540',
  'M 880 95 L 880 540',
  'M 120 320 L 250 320',
  'M 750 320 L 880 320',
  'M 500 215 L 500 300',
  'M 500 300 L 500 415',
  'M 300 215 L 300 320 L 700 320 L 700 215',
  'M 300 485 L 300 540 L 700 540 L 700 485',
];

function pier(
  prefix: string,
  terminal: string,
  startX: number,
  y: number,
  count: number,
  step: number,
  opts: { gateType?: GateType; size?: AircraftSize; jetBridge?: boolean } = {}
): GateBlueprint[] {
  const gates: GateBlueprint[] = [];
  for (let i = 0; i < count; i++) {
    gates.push({
      code: `${prefix}${i + 1}`,
      terminal,
      gateType: opts.gateType ?? 'contact',
      maxAircraftSize: opts.size ?? 'narrow',
      hasJetBridge: opts.jetBridge ?? true,
      x: startX + i * step,
      y,
    });
  }
  return gates;
}

// Fixed physical stands. Status is assigned dynamically by the mock data layer.
export const GATE_BLUEPRINTS: GateBlueprint[] = [
  // Terminal 1 — north face (Pier A wide-body capable)
  ...pier('A', 'T1', 270, 70, 4, 48, { size: 'wide', jetBridge: true }),
  // Terminal 1 — south face
  ...pier('B', 'T1', 290, 232, 8, 52, { size: 'narrow', jetBridge: true }),
  // Pier B north
  ...pier('C', 'T1', 700, 70, 4, 48, { size: 'wide', jetBridge: true }),
  // Terminal 2 — north face
  ...pier('D', 'T2', 320, 402, 7, 52, { size: 'narrow', jetBridge: true }),
  // Terminal 2 — south face
  ...pier('E', 'T2', 340, 502, 6, 56, { size: 'narrow', jetBridge: true }),
  // Remote apron (bus-boarding, no jet bridge)
  ...pier('R', 'Remote', 210, 360, 3, 26, { gateType: 'remote', size: 'any', jetBridge: false }),
  // Cargo apron
  ...pier('K', 'Cargo', 800, 340, 3, 50, { gateType: 'cargo', size: 'wide', jetBridge: false }),
];
