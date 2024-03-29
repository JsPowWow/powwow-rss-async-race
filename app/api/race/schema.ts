import * as v from 'valibot';
import { boolean, number } from 'valibot';

export const GarageCarResponseSchema = v.object({
  id: v.number(),
  name: v.string(),
  color: v.string(),
});
export const GetGarageCarsResponseSchema = v.array(GarageCarResponseSchema);
export const CarStartEngineSchema = v.object({
  velocity: number(),
  distance: number(),
});
export const SuccessResponseSchema = v.object({
  success: boolean(),
});
