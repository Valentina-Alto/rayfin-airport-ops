import { entity, authenticated, uuid, text, set, boolean } from '@microsoft/rayfin-core';

/**
 * A physical aircraft stand / gate at the airport.
 * `status` and `gateType` are enumerated sets so they map cleanly to the UI.
 */
@entity()
@authenticated('*')
export class Gate {
  @uuid() id!: string;
  @text({ max: 8 }) code!: string;
  @text({ max: 16 }) terminal!: string;
  @set('contact', 'remote', 'cargo')
  gateType!: 'contact' | 'remote' | 'cargo';
  @set('narrow', 'wide', 'any')
  maxAircraftSize!: 'narrow' | 'wide' | 'any';
  @set('available', 'occupied', 'maintenance')
  status!: 'available' | 'occupied' | 'maintenance';
  @boolean() hasJetBridge!: boolean;
}
