import type { Either } from '@sweet-monads/either';
import { fromPromise } from '@sweet-monads/either';
import type * as v from 'valibot';
import { parse } from 'valibot';

import { getImageAsync } from '@/utils';

import { validateResponseStatus } from './errors.ts';
import type { GarageCarResponseSchema } from './schema.ts';
import { CarStartEngineSchema, GetGarageCarsResponseSchema, SuccessResponseSchema } from './schema.ts';

const API_URL = import.meta.env.VITE_RACE_API_URL;
const ASSETS_URL = import.meta.env.VITE_ASSETS_URL;

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

export const getGarageCars = async (): Promise<Either<Error, GetGarageCarsResponse>> => {
  return fromPromise<Error, GetGarageCarsResponse>(
    fetch(`${API_URL}/garage`, { method: 'GET' })
      .then((r) => r.json())
      .then((data) => parse(GetGarageCarsResponseSchema, data)),
  );
};

export type CarEngineStartStopData = WithCarId<CarStartEngineResponse>;
export const setCarEngineStarted = async (payload: {
  id: number;
}): Promise<Either<CarResponseError, CarEngineStartStopData>> => {
  return fromPromise<CarResponseError, CarEngineStartStopData>(
    fetch(`${API_URL}/engine?id=${payload.id}&status=started`, { method: 'PATCH' })
      .then(validateResponseStatus(payload.id))
      .then((data) => parse(CarStartEngineSchema, data))
      .then(withCarId(payload.id)),
  );
};

export const setCarEngineStopped = async (payload: {
  id: number;
}): Promise<Either<CarResponseError, CarEngineStartStopData>> => {
  return fromPromise<CarResponseError, CarEngineStartStopData>(
    fetch(`${API_URL}/engine?id=${payload.id}&status=stopped`, { method: 'PATCH' })
      .then(validateResponseStatus(payload.id))
      .then((data) => parse(CarStartEngineSchema, data))
      .then(withCarId(payload.id)),
  );
};

export type CarEngineDriveStatusData = WithCarId<SuccessResponse>;
export const setCarEngineDrive = (abortController?: (s: AbortController) => void) => {
  return async (payload: { id: number }): Promise<Either<CarResponseError, CarEngineDriveStatusData>> => {
    const controller = new AbortController();
    if (abortController) {
      abortController(controller);
    }
    return fromPromise<CarResponseError, CarEngineDriveStatusData>(
      fetch(`${API_URL}/engine?id=${payload.id}&status=drive`, { method: 'PATCH', signal: controller.signal })
        .then(validateResponseStatus(payload.id))
        .then((data) => parse(SuccessResponseSchema, data))
        .then(withCarId(payload.id)),
    );
  };
};

export const getCarImage = async (car: 'car1' | 'car2' | 'car3'): Promise<HTMLImageElement> =>
  getImageAsync(`${ASSETS_URL}/${car}.png`);

export const getRoadImage = async (): Promise<HTMLImageElement> => getImageAsync(`${ASSETS_URL}/roadtexture.jpg`);
