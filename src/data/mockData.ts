import { GATE_BLUEPRINTS } from '@/data/airportLayout';
import type {
  Aircraft,
  AircraftStatus,
  AirportDataset,
  BodyType,
  CargoCategory,
  CargoPriority,
  CargoShipment,
  CargoStatus,
  Department,
  Employee,
  EmployeeStatus,
  Flight,
  FlightDirection,
  FlightStatus,
  Gate,
  OpsConditions,
  Shift,
  WeatherCondition,
} from '@/domain/types';

// --- Deterministic PRNG (mulberry32) so the demo renders identically every load ---
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed: number) {
  const r = mulberry32(seed);
  return {
    next: r,
    int: (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)],
    chance: (p: number) => r() < p,
  };
}

type Rng = ReturnType<typeof makeRng>;

const AIRLINES = [
  { name: 'Aurora Air', code: 'AU' },
  { name: 'Nordwind', code: 'NW' },
  { name: 'BluePeak', code: 'BP' },
  { name: 'Cinnabar', code: 'CB' },
  { name: 'Helios', code: 'HX' },
  { name: 'Meridian', code: 'MD' },
  { name: 'Polaris Cargo', code: 'PC' },
] as const;

const FLEET_TYPES: { model: string; body: BodyType; seats: number; cargo: number }[] = [
  { model: 'Embraer E190', body: 'regional', seats: 100, cargo: 3000 },
  { model: 'Airbus A220', body: 'regional', seats: 130, cargo: 4000 },
  { model: 'Airbus A320neo', body: 'narrow', seats: 180, cargo: 7000 },
  { model: 'Boeing 737-800', body: 'narrow', seats: 189, cargo: 8000 },
  { model: 'Boeing 787-9', body: 'wide', seats: 290, cargo: 22000 },
  { model: 'Airbus A350-900', body: 'wide', seats: 315, cargo: 28000 },
  { model: 'Boeing 777F', body: 'wide', seats: 0, cargo: 102000 },
];

const AIRPORTS = [
  'JFK', 'LHR', 'CDG', 'AMS', 'FRA', 'MAD', 'FCO', 'DXB', 'SIN', 'IST',
  'ORD', 'LAX', 'GRU', 'NRT', 'HEL', 'OSL', 'CPH', 'ZRH', 'VIE', 'DUB',
];

const HOME = 'AERO';

const FIRST_NAMES = [
  'Mateo', 'Sofia', 'Liam', 'Amara', 'Noah', 'Yuki', 'Elena', 'Omar', 'Priya', 'Diego',
  'Freya', 'Kwame', 'Ines', 'Hassan', 'Mei', 'Tomas', 'Aisha', 'Lukas', 'Nadia', 'Ravi',
];
const LAST_NAMES = [
  'Alvarez', 'Novak', 'Okafor', 'Bauer', 'Costa', 'Khan', 'Rossi', 'Larsen', 'Yamamoto', 'Singh',
  'Moreau', 'Haddad', 'Kowalski', 'Andersen', 'Romano', 'Dubois', 'Petrov', 'Nguyen', 'Schmidt', 'Patel',
];

const DEPARTMENTS: { dept: Department; roles: string[]; zone: string }[] = [
  { dept: 'ground_ops', roles: ['Ramp Agent', 'Pushback Driver', 'Marshaller', 'Ops Coordinator'], zone: 'Apron' },
  { dept: 'security', roles: ['Screening Officer', 'Patrol', 'Access Control'], zone: 'Checkpoint' },
  { dept: 'cargo', roles: ['Cargo Handler', 'Loadmaster', 'Warehouse Lead'], zone: 'Cargo City' },
  { dept: 'maintenance', roles: ['Aircraft Technician', 'Avionics Eng.', 'Line Mechanic'], zone: 'Hangar' },
  { dept: 'customer_service', roles: ['Gate Agent', 'Check-in Agent', 'Lounge Host'], zone: 'Terminal' },
  { dept: 'fuel', roles: ['Fuel Technician', 'Hydrant Operator'], zone: 'Fuel Farm' },
];

const CARGO_DESCRIPTIONS: { category: CargoCategory; items: string[] }[] = [
  { category: 'general', items: ['Consumer electronics', 'Auto parts', 'Textiles', 'Machinery'] },
  { category: 'perishable', items: ['Fresh produce', 'Cut flowers', 'Seafood', 'Dairy'] },
  { category: 'dangerous', items: ['Lithium batteries', 'Industrial chemicals', 'Compressed gas'] },
  { category: 'pharma', items: ['Vaccines (2-8°C)', 'Insulin shipment', 'Clinical trial kit'] },
  { category: 'mail', items: ['Express mail', 'Parcel post', 'Diplomatic pouch'] },
  { category: 'valuable', items: ['Bullion', 'Fine art crate', 'Banknote consignment'] },
];

function pad(n: number, len = 3) {
  return String(n).padStart(len, '0');
}

function buildConditions(rng: Rng): OpsConditions {
  const condition = rng.pick<WeatherCondition>(['clear', 'clear', 'cloudy', 'cloudy', 'rain', 'fog', 'snow']);
  const visByCond: Record<WeatherCondition, [number, number]> = {
    clear: [9, 10],
    cloudy: [7, 10],
    rain: [3, 7],
    fog: [0.4, 2],
    snow: [1, 4],
  };
  const [vMin, vMax] = visByCond[condition];
  return {
    condition,
    visibilityKm: Math.round((vMin + rng.next() * (vMax - vMin)) * 10) / 10,
    windKt: rng.int(3, 34),
    congestion: Math.round(rng.next() * 100) / 100,
  };
}

function buildAircraft(rng: Rng, count: number): Aircraft[] {
  const out: Aircraft[] = [];
  for (let i = 0; i < count; i++) {
    const t = rng.pick(FLEET_TYPES);
    const airline = t.model.includes('777F') ? AIRLINES[6] : rng.pick(AIRLINES.slice(0, 6));
    const reg = `AE-${String.fromCharCode(65 + rng.int(0, 25))}${String.fromCharCode(65 + rng.int(0, 25))}${rng.int(100, 999)}`;
    const status = rng.pick<AircraftStatus>([
      'in_service', 'in_service', 'boarding', 'taxiing', 'airborne', 'maintenance',
    ]);
    out.push({
      id: `ac-${pad(i)}`,
      registration: reg,
      model: t.model,
      airline: airline.name,
      bodyType: t.body,
      seatCapacity: t.seats,
      cargoCapacityKg: t.cargo,
      status,
    });
  }
  return out;
}

function buildGates(rng: Rng): Gate[] {
  return GATE_BLUEPRINTS.map((b, i) => {
    const status = rng.chance(0.06)
      ? 'maintenance'
      : rng.chance(0.5)
        ? 'occupied'
        : 'available';
    return {
      id: `gate-${pad(i)}`,
      code: b.code,
      terminal: b.terminal,
      gateType: b.gateType,
      maxAircraftSize: b.maxAircraftSize,
      status,
      hasJetBridge: b.hasJetBridge,
      x: b.x,
      y: b.y,
    };
  });
}

function minutesAgo(now: Date, mins: number): Date {
  return new Date(now.getTime() + mins * 60_000);
}

function buildFlights(
  rng: Rng,
  now: Date,
  aircraft: Aircraft[],
  gates: Gate[],
  conditions: OpsConditions
): Flight[] {
  const flights: Flight[] = [];
  const count = 44;
  const passengerGates = gates.filter((g) => g.gateType !== 'cargo');
  const weatherDelayBias =
    conditions.condition === 'fog' ? 0.45
      : conditions.condition === 'snow' ? 0.4
        : conditions.condition === 'rain' ? 0.25
          : 0.08;

  for (let i = 0; i < count; i++) {
    const direction: FlightDirection = rng.chance(0.5) ? 'arrival' : 'departure';
    const airline = rng.pick(AIRLINES.slice(0, 6));
    const ac = rng.pick(aircraft.filter((a) => a.bodyType !== 'wide' || rng.chance(0.7)));
    // Spread schedule from 4h ago to 8h ahead.
    const offsetMin = rng.int(-240, 480);
    const scheduled = minutesAgo(now, offsetMin);

    // Latent delay driven by weather + congestion + random ops noise.
    const disrupted = rng.next() < weatherDelayBias + conditions.congestion * 0.18;
    const delayMin = disrupted ? rng.int(15, 95) : rng.chance(0.25) ? rng.int(3, 14) : 0;
    const estimatedTime = new Date(scheduled.getTime() + delayMin * 60_000);

    let status: FlightStatus;
    const minutesFromNow = (scheduled.getTime() - now.getTime()) / 60_000 + delayMin;
    if (rng.chance(0.04) && minutesFromNow > 30) status = 'cancelled';
    else if (minutesFromNow < -45) status = direction === 'arrival' ? 'landed' : 'departed';
    else if (minutesFromNow < 25 && minutesFromNow > -45) status = 'boarding';
    else if (delayMin >= 15) status = 'delayed';
    else status = 'on_time';

    const remote = airline.code;
    const home = HOME;
    const other = rng.pick(AIRPORTS);

    const assignGate = status !== 'cancelled' && Math.abs(minutesFromNow) < 240 && rng.chance(0.7);
    const gate = assignGate ? rng.pick(passengerGates) : undefined;

    flights.push({
      id: `fl-${pad(i)}`,
      flightNumber: `${remote}${rng.int(100, 9990)}`,
      airline: airline.name,
      direction,
      origin: direction === 'arrival' ? other : home,
      destination: direction === 'arrival' ? home : other,
      scheduledTime: scheduled,
      estimatedTime,
      status,
      passengerCount: ac.seatCapacity > 0 ? rng.int(Math.floor(ac.seatCapacity * 0.5), ac.seatCapacity) : 0,
      aircraftId: ac.id,
      gateId: gate?.id,
    });
  }
  return flights.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
}

function buildEmployees(rng: Rng, count: number): Employee[] {
  const out: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const d = rng.pick(DEPARTMENTS);
    const status = rng.pick<EmployeeStatus>(['on_duty', 'on_duty', 'on_duty', 'on_break', 'off_duty']);
    out.push({
      id: `emp-${pad(i)}`,
      fullName: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
      role: rng.pick(d.roles),
      department: d.dept,
      shift: rng.pick<Shift>(['morning', 'afternoon', 'night']),
      status,
      zone: d.zone,
    });
  }
  return out;
}

function buildCargo(rng: Rng, count: number, flights: Flight[]): CargoShipment[] {
  const out: CargoShipment[] = [];
  const cargoFlights = flights.filter((f) => f.status !== 'cancelled');
  for (let i = 0; i < count; i++) {
    const c = rng.pick(CARGO_DESCRIPTIONS);
    const linked = rng.chance(0.8) ? rng.pick(cargoFlights) : undefined;
    const priority = rng.pick<CargoPriority>(['low', 'standard', 'standard', 'high', 'critical']);
    const status = rng.pick<CargoStatus>([
      'booked', 'received', 'screening', 'loading', 'loaded', 'in_transit', 'delivered',
    ]);
    out.push({
      id: `cg-${pad(i)}`,
      awb: `${rng.int(100, 999)}-${rng.int(10000000, 99999999)}`,
      description: rng.pick(c.items),
      category: c.category,
      weightKg: rng.int(40, 12000),
      priority,
      status,
      flightId: linked?.id,
    });
  }
  return out;
}

/**
 * Generate a complete, internally-consistent demo dataset. The same `seed`
 * always produces the same data; `now` controls the schedule window.
 */
export function generateAirportData(seed = 42, now: Date = new Date()): AirportDataset {
  const rng = makeRng(seed);
  const conditions = buildConditions(rng);
  const aircraft = buildAircraft(rng, 30);
  const gates = buildGates(rng);
  const flights = buildFlights(rng, now, aircraft, gates, conditions);
  const employees = buildEmployees(rng, 140);
  const cargo = buildCargo(rng, 64, flights);
  return { gates, aircraft, flights, employees, cargo, conditions, now };
}
