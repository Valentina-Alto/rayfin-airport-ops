import { entity, authenticated, uuid, text, set } from '@microsoft/rayfin-core';

/** A member of ground/airside staff. */
@entity()
@authenticated('*')
export class Employee {
  @uuid() id!: string;
  @text({ max: 60 }) fullName!: string;
  @text({ max: 40 }) role!: string;
  @set('ground_ops', 'security', 'cargo', 'maintenance', 'customer_service', 'fuel')
  department!:
    | 'ground_ops'
    | 'security'
    | 'cargo'
    | 'maintenance'
    | 'customer_service'
    | 'fuel';
  @set('morning', 'afternoon', 'night')
  shift!: 'morning' | 'afternoon' | 'night';
  @set('on_duty', 'on_break', 'off_duty')
  status!: 'on_duty' | 'on_break' | 'off_duty';
  @text({ max: 16 }) zone!: string;
}
