import { useMemo } from 'react';

import {
  BUILDINGS,
  MAP_HEIGHT,
  MAP_WIDTH,
  RUNWAYS,
  TAXIWAYS,
  TERMINALS,
} from '@/data/airportLayout';
import type { AirportDataset, Flight, Gate } from '@/domain/types';

const STATUS_FILL: Record<Gate['status'], string> = {
  available: '#34d399',
  occupied: '#38bdf8',
  maintenance: '#fbbf24',
};

function PlaneGlyph({ x, y, color }: { x: number; y: number; color: string }) {
  // Small top-down aircraft silhouette centred on (x, y).
  return (
    <path
      transform={`translate(${x}, ${y}) scale(0.55) rotate(0)`}
      d="M0,-9 L1.6,-2 L9,2 L9,4 L1.6,2.6 L1.2,8 L4,10 L4,11.5 L0,10.5 L-4,11.5 L-4,10 L-1.2,8 L-1.6,2.6 L-9,4 L-9,2 L-1.6,-2 Z"
      fill={color}
      opacity={0.95}
    />
  );
}

export function AirportMap({
  data,
  selectedGateId,
  onSelectGate,
}: {
  data: AirportDataset;
  selectedGateId: string | null;
  onSelectGate: (gateId: string | null) => void;
}) {
  // Map each gate to the active flight currently using it (closest slot to now).
  const gateFlight = useMemo(() => {
    const m = new Map<string, Flight>();
    const active = data.flights.filter(
      (f) => f.gateId && f.status !== 'departed' && f.status !== 'landed' && f.status !== 'cancelled'
    );
    for (const f of active) {
      const existing = m.get(f.gateId!);
      if (
        !existing ||
        Math.abs(f.scheduledTime.getTime() - data.now.getTime()) <
          Math.abs(existing.scheduledTime.getTime() - data.now.getTime())
      ) {
        m.set(f.gateId!, f);
      }
    }
    return m;
  }, [data]);

  const aircraftById = useMemo(
    () => new Map(data.aircraft.map((a) => [a.id, a] as const)),
    [data]
  );

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="h-full w-full"
      role="img"
      aria-label="Airport apron map"
      onClick={() => onSelectGate(null)}
    >
      <defs>
        <linearGradient id="apron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#apron)" />

      {/* Runways */}
      {RUNWAYS.map((r) => (
        <g key={r.id}>
          <rect x={r.x} y={r.y} width={r.width} height={r.height} rx="3" fill="#1e293b" />
          <line
            x1={r.x + 14}
            y1={r.y + r.height / 2}
            x2={r.x + r.width - 14}
            y2={r.y + r.height / 2}
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="22 16"
          />
          <text x={r.x + 8} y={r.y + r.height / 2 + 4} fontSize="11" fill="#64748b" fontFamily="monospace">
            {r.label}
          </text>
        </g>
      ))}

      {/* Taxiways */}
      {TAXIWAYS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#facc15"
          strokeOpacity="0.25"
          strokeWidth="2.5"
          strokeDasharray="6 10"
        />
      ))}

      {/* Buildings */}
      {BUILDINGS.map((b) => (
        <g key={b.id}>
          <rect
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            rx="6"
            fill={b.kind === 'tower' ? '#334155' : '#1f2a3a'}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <text
            x={b.x + b.width / 2}
            y={b.y + b.height / 2 + 4}
            fontSize="11"
            fill="#94a3b8"
            textAnchor="middle"
          >
            {b.label}
          </text>
        </g>
      ))}

      {/* Terminal concourses */}
      {TERMINALS.map((t) => (
        <g key={t.id}>
          <rect
            x={t.x}
            y={t.y}
            width={t.width}
            height={t.height}
            rx="8"
            fill="#243244"
            stroke="#3b4a5e"
            strokeWidth="1.5"
          />
          <text
            x={t.x + t.width / 2}
            y={t.y + t.height / 2 + 4}
            fontSize="12"
            fontWeight="600"
            fill="#cbd5e1"
            textAnchor="middle"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Gates */}
      {data.gates.map((g) => {
        const selected = g.id === selectedGateId;
        const flight = gateFlight.get(g.id);
        const ac = flight?.aircraftId ? aircraftById.get(flight.aircraftId) : undefined;
        const fill = STATUS_FILL[g.status];
        return (
          <g
            key={g.id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelectGate(selected ? null : g.id);
            }}
          >
            <title>
              {`Gate ${g.code} · ${g.terminal} · ${g.status}`}
              {flight ? `\n${flight.flightNumber} ${flight.airline}` : ''}
              {ac ? `\n${ac.model}` : ''}
            </title>
            {selected && <circle cx={g.x} cy={g.y} r="26" fill="url(#glow)" />}
            <circle
              cx={g.x}
              cy={g.y}
              r={selected ? 11 : 8}
              fill={fill}
              fillOpacity={g.status === 'available' ? 0.35 : 0.9}
              stroke={selected ? '#e2e8f0' : fill}
              strokeWidth={selected ? 2 : 1}
            />
            {flight && ac && <PlaneGlyph x={g.x} y={g.y} color="#0b1220" />}
            <text
              x={g.x}
              y={g.y - 13}
              fontSize="9"
              fill="#94a3b8"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {g.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
