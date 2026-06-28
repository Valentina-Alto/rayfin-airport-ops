// Shared UI domain types for the AeroOps demo. These mirror the Rayfin entities
// in rayfin/data/*, extended with computed and map-positioning fields used by
// the dashboard and the predictive models.

export type GateType = 'contact' | 'remote' | 'cargo';
export type AircraftSize = 'narrow' | 'wide' | 'any';
export type GateStatus = 'available' | 'occupied' | 'maintenance';

export interface Gate {
  id: string;
  code: string;
  terminal: string;
  gateType: GateType;
  maxAircraftSize: AircraftSize;
  status: GateStatus;
  hasJetBridge: boolean;
  /** Map coordinates in the 0..1000 x / 0..640 y SVG viewbox. */
  x: number;
  y: number;
}

export type BodyType = 'regional' | 'narrow' | 'wide';
export type AircraftStatus =
  | 'in_service'
  | 'boarding'
  | 'taxiing'
  | 'airborne'
  | 'maintenance';

export interface Aircraft {
  id: string;
  registration: string;
  model: string;
  airline: string;
  bodyType: BodyType;
  seatCapacity: number;
  cargoCapacityKg: number;
  status: AircraftStatus;
}

export type FlightDirection = 'arrival' | 'departure';
export type FlightStatus =
  | 'on_time'
  | 'delayed'
  | 'boarding'
  | 'departed'
  | 'landed'
  | 'cancelled';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  direction: FlightDirection;
  origin: string;
  destination: string;
  scheduledTime: Date;
  estimatedTime: Date;
  status: FlightStatus;
  passengerCount: number;
  aircraftId?: string;
  gateId?: string;
}

export type Department =
  | 'ground_ops'
  | 'security'
  | 'cargo'
  | 'maintenance'
  | 'customer_service'
  | 'fuel';
export type Shift = 'morning' | 'afternoon' | 'night';
export type EmployeeStatus = 'on_duty' | 'on_break' | 'off_duty';

export interface Employee {
  id: string;
  fullName: string;
  role: string;
  department: Department;
  shift: Shift;
  status: EmployeeStatus;
  zone: string;
}

export type CargoCategory =
  | 'general'
  | 'perishable'
  | 'dangerous'
  | 'pharma'
  | 'mail'
  | 'valuable';
export type CargoPriority = 'low' | 'standard' | 'high' | 'critical';
export type CargoStatus =
  | 'booked'
  | 'received'
  | 'screening'
  | 'loading'
  | 'loaded'
  | 'in_transit'
  | 'delivered';

export interface CargoShipment {
  id: string;
  awb: string;
  description: string;
  category: CargoCategory;
  weightKg: number;
  priority: CargoPriority;
  status: CargoStatus;
  flightId?: string;
}

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';

export interface OpsConditions {
  condition: WeatherCondition;
  visibilityKm: number;
  windKt: number;
  /** 0..1 — how congested the airfield currently is. */
  congestion: number;
}

export interface AirportDataset {
  gates: Gate[];
  aircraft: Aircraft[];
  flights: Flight[];
  employees: Employee[];
  cargo: CargoShipment[];
  conditions: OpsConditions;
  /** Wall-clock "now" the dataset was generated around. */
  now: Date;
}

// ---- Predictive model output types -------------------------------------------------

export interface GateAllocationRecommendation {
  flightId: string;
  flightNumber: string;
  airline: string;
  direction: FlightDirection;
  recommendedGateId: string;
  recommendedGateCode: string;
  /** 0..100 confidence in the recommendation. */
  confidence: number;
  score: number;
  reasons: string[];
  /** True when this differs from the flight's currently assigned gate. */
  isReassignment: boolean;
  currentGateCode?: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface DisruptionPrediction {
  flightId: string;
  flightNumber: string;
  airline: string;
  direction: FlightDirection;
  /** 0..1 probability the flight is disrupted (delay >= 15 min or cancellation). */
  probability: number;
  predictedDelayMinutes: number;
  riskLevel: RiskLevel;
  topFactors: { label: string; weight: number }[];
}
