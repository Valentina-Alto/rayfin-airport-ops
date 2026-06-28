import { generateAirportData } from '@/data/mockData';

import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface SeedProgress {
  /** Human-readable name of the group currently being written. */
  step: string;
  /** Records written so far across all groups. */
  done: number;
  /** Total records that will be written. */
  total: number;
}

export interface SeedResult {
  gates: number;
  aircraft: number;
  employees: number;
  flights: number;
  cargo: number;
  /** True when seeding was skipped because data already existed. */
  skipped: boolean;
}

export interface SeedOptions {
  /** Re-seed even if the database already contains data. */
  force?: boolean;
  onProgress?: (progress: SeedProgress) => void;
}

/** Run `worker` over `items` with a bounded number of concurrent calls. */
async function pool<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        await worker(items[index]);
      }
    }
  );
  await Promise.all(runners);
}

/** True when the live backend already holds at least one Gate record. */
export async function isDatabaseSeeded(): Promise<boolean> {
  const client = getRayfinClient();
  const existing = await client.data.Gate.select(['id']).execute();
  return existing.length > 0;
}

/**
 * Populate the deployed Fabric SQL database with the same deterministic demo
 * dataset the dashboard renders. Must run from an authenticated session — in
 * Fabric this means opening the app inside the Fabric Portal (SSO), since the
 * backend accepts Entra identities only.
 *
 * Records are written parents-first so foreign keys resolve to real UUIDs:
 * Gates + Aircraft + Employees, then Flights (→ gate/aircraft), then Cargo (→ flight).
 */
export async function seedFabricDatabase(
  options: SeedOptions = {}
): Promise<SeedResult> {
  if (isLocalBackend()) {
    throw new Error(
      'Seeding targets the deployed Fabric backend. The app is currently bootstrapped against a localhost backend.'
    );
  }

  const client = getRayfinClient();
  const onProgress = options.onProgress ?? (() => {});

  if (!options.force && (await isDatabaseSeeded())) {
    return { gates: 0, aircraft: 0, employees: 0, flights: 0, cargo: 0, skipped: true };
  }

  const data = generateAirportData(42, new Date());

  const gateIdMap = new Map<string, string>();
  const aircraftIdMap = new Map<string, string>();
  const flightIdMap = new Map<string, string>();

  const total =
    data.gates.length +
    data.aircraft.length +
    data.employees.length +
    data.flights.length +
    data.cargo.length;
  let done = 0;
  const tick = (step: string) => onProgress({ step, done: ++done, total });

  await pool(data.gates, 6, async (gate) => {
    const created = await client.data.Gate.create({
      code: gate.code,
      terminal: gate.terminal,
      gateType: gate.gateType,
      maxAircraftSize: gate.maxAircraftSize,
      status: gate.status,
      hasJetBridge: gate.hasJetBridge,
    });
    gateIdMap.set(gate.id, created.id);
    tick('Gates');
  });

  await pool(data.aircraft, 6, async (aircraft) => {
    const created = await client.data.Aircraft.create({
      registration: aircraft.registration,
      model: aircraft.model,
      airline: aircraft.airline,
      bodyType: aircraft.bodyType,
      seatCapacity: aircraft.seatCapacity,
      cargoCapacityKg: aircraft.cargoCapacityKg,
      status: aircraft.status,
    });
    aircraftIdMap.set(aircraft.id, created.id);
    tick('Aircraft');
  });

  await pool(data.employees, 8, async (employee) => {
    await client.data.Employee.create({
      fullName: employee.fullName,
      role: employee.role,
      department: employee.department,
      shift: employee.shift,
      status: employee.status,
      zone: employee.zone,
    });
    tick('Workforce');
  });

  await pool(data.flights, 6, async (flight) => {
    const aircraftId = flight.aircraftId
      ? aircraftIdMap.get(flight.aircraftId)
      : undefined;
    const gateId = flight.gateId ? gateIdMap.get(flight.gateId) : undefined;
    const created = await client.data.Flight.create({
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      direction: flight.direction,
      origin: flight.origin,
      destination: flight.destination,
      scheduledTime: flight.scheduledTime,
      estimatedTime: flight.estimatedTime,
      status: flight.status,
      passengerCount: flight.passengerCount,
      ...(aircraftId ? { aircraft: { id: aircraftId } } : {}),
      ...(gateId ? { gate: { id: gateId } } : {}),
    });
    flightIdMap.set(flight.id, created.id);
    tick('Flights');
  });

  await pool(data.cargo, 8, async (cargo) => {
    const flightId = cargo.flightId ? flightIdMap.get(cargo.flightId) : undefined;
    await client.data.CargoShipment.create({
      awb: cargo.awb,
      description: cargo.description,
      category: cargo.category,
      weightKg: cargo.weightKg,
      priority: cargo.priority,
      status: cargo.status,
      ...(flightId ? { flight: { id: flightId } } : {}),
    });
    tick('Cargo');
  });

  return {
    gates: gateIdMap.size,
    aircraft: aircraftIdMap.size,
    employees: data.employees.length,
    flights: flightIdMap.size,
    cargo: data.cargo.length,
    skipped: false,
  };
}
