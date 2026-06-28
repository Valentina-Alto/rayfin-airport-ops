import type { Aircraft } from './Aircraft.js';
import type { CargoShipment } from './CargoShipment.js';
import type { Employee } from './Employee.js';
import type { Flight } from './Flight.js';
import type { Gate } from './Gate.js';

/**
 * Binds entity names to their classes so RayfinClient can expose typed
 * GraphQL proxies (client.data.Flight, client.data.Gate, ...).
 */
export type AppSchema = {
  Gate: Gate;
  Aircraft: Aircraft;
  Flight: Flight;
  Employee: Employee;
  CargoShipment: CargoShipment;
};

/** Retained for backwards compatibility with the original blank-app scaffold. */
export type BlankAppSchema = AppSchema;

export const schema = [];
