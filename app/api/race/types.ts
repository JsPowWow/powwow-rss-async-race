import * as v from 'valibot';

const CarResponseSchema = v.object({
  id: v.number(),
  name: v.string(),
  color: v.string(),
});

export const CarsResponseSchema = v.array(CarResponseSchema);

export type CarResponse = v.Output<typeof CarResponseSchema>;
export type CarsResponse = v.Output<typeof CarsResponseSchema>;
