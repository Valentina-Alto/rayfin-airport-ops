import { entity, authenticated, uuid, text, set, int, one } from '@microsoft/rayfin-core';
import { Flight } from './Flight.js';

/** A cargo shipment moving through the airport, optionally linked to a flight. */
@entity()
@authenticated('*')
export class CargoShipment {
  @uuid() id!: string;
  @text({ max: 16 }) awb!: string;
  @text({ max: 80 }) description!: string;
  @set('general', 'perishable', 'dangerous', 'pharma', 'mail', 'valuable')
  category!: 'general' | 'perishable' | 'dangerous' | 'pharma' | 'mail' | 'valuable';
  @int() weightKg!: number;
  @set('low', 'standard', 'high', 'critical')
  priority!: 'low' | 'standard' | 'high' | 'critical';
  @set('booked', 'received', 'screening', 'loading', 'loaded', 'in_transit', 'delivered')
  status!:
    | 'booked'
    | 'received'
    | 'screening'
    | 'loading'
    | 'loaded'
    | 'in_transit'
    | 'delivered';

  @uuid({ optional: true }) flight_id?: string;
  @one(() => Flight, { optional: true }) flight?: Flight;
}
