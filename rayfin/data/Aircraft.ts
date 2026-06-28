import { entity, authenticated, uuid, text, set, int } from '@microsoft/rayfin-core';

/** An aircraft in the operating fleet. */
@entity()
@authenticated('*')
export class Aircraft {
  @uuid() id!: string;
  @text({ max: 10 }) registration!: string;
  @text({ max: 40 }) model!: string;
  @text({ max: 40 }) airline!: string;
  @set('regional', 'narrow', 'wide')
  bodyType!: 'regional' | 'narrow' | 'wide';
  @int() seatCapacity!: number;
  @int() cargoCapacityKg!: number;
  @set('in_service', 'boarding', 'taxiing', 'airborne', 'maintenance')
  status!: 'in_service' | 'boarding' | 'taxiing' | 'airborne' | 'maintenance';
}
