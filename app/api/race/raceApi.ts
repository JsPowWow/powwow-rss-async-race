import type { Either } from '@sweet-monads/either';
import { fromPromise } from '@sweet-monads/either';
import type * as v from 'valibot';
import { parse } from 'valibot';

import { validateResponseStatus } from './errors.ts';
import type { GarageCarResponseSchema } from './schema.ts';
import { CarStartEngineSchema, GetGarageCarsResponseSchema, SuccessResponseSchema } from './schema.ts';

const API_URL = import.meta.env.VITE_RACE_API_URL;

export type GarageCarResponse = v.Output<typeof GarageCarResponseSchema>;
export type GetGarageCarsResponse = v.Output<typeof GetGarageCarsResponseSchema>;
export type CarStartEngineResponse = v.Output<typeof CarStartEngineSchema>;
export type SuccessResponse = v.Output<typeof SuccessResponseSchema>;
export type CarResponseError = WithCarId<Error>;
export type CarId = { carId: number };
export type WithCarId<T> = T & CarId;

export const withCarId =
  (carId: number) =>
  <T extends object>(data: T): WithCarId<T> =>
    Object.assign(data, { carId });

export const isFulfilled = <T>(s: PromiseSettledResult<T>): s is PromiseFulfilledResult<T> => s.status === 'fulfilled';
export const toFulfilledValue = <T>(r: PromiseFulfilledResult<T>): T => r.value;

export const getGarage = async (): Promise<Either<Error, GetGarageCarsResponse>> => {
  return fromPromise<Error, GetGarageCarsResponse>(
    fetch(`${API_URL}/garage`, { method: 'GET' })
      .then((r) => r.json())
      .then((data) => parse(GetGarageCarsResponseSchema, data)),
  );
};

export type CarEngineStartedData = WithCarId<CarStartEngineResponse>;
export const setCarEngineStarted = async (payload: {
  id: number;
}): Promise<Either<CarResponseError, CarEngineStartedData>> => {
  return fromPromise<CarResponseError, CarEngineStartedData>(
    fetch(`${API_URL}/engine?id=${payload.id}&status=started`, { method: 'PATCH' })
      .then(validateResponseStatus(payload.id))
      .then((data) => parse(CarStartEngineSchema, data))
      .then(withCarId(payload.id)),
  );
};

export type CarEngineDriveFinishData = WithCarId<SuccessResponse>;
export const setCarEngineDrive = async (payload: {
  id: number;
}): Promise<Either<CarResponseError, CarEngineDriveFinishData>> => {
  return fromPromise<CarResponseError, CarEngineDriveFinishData>(
    fetch(`${API_URL}/engine?id=${payload.id}&status=drive`, { method: 'PATCH' })
      .then(validateResponseStatus(payload.id))
      .then((data) => parse(SuccessResponseSchema, data))
      .then(withCarId(payload.id)),
  );
};
