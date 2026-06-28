import { entity, authenticated, uuid, text, set, int, date, one } from '@microsoft/rayfin-core';
import { Aircraft } from './Aircraft.js';
import { Gate } from './Gate.js';

/** A scheduled arrival or departure. */
@entity()
@authenticated('*')
export class Flight {
  @uuid() id!: string;
  @text({ max: 8 }) flightNumber!: string;
  @text({ max: 40 }) airline!: string;
  @set('arrival', 'departure')
  direction!: 'arrival' | 'departure';
  @text({ max: 4 }) origin!: string;
  @text({ max: 4 }) destination!: string;
  @date() scheduledTime!: Date;
  @date() estimatedTime!: Date;
  @set('on_time', 'delayed', 'boarding', 'departed', 'landed', 'cancelled')
  status!: 'on_time' | 'delayed' | 'boarding' | 'departed' | 'landed' | 'cancelled';
  @int() passengerCount!: number;

  @uuid({ optional: true }) aircraft_id?: string;
  @one(() => Aircraft, { optional: true }) aircraft?: Aircraft;

  @uuid({ optional: true }) gate_id?: string;
  @one(() => Gate, { optional: true }) gate?: Gate;
}
