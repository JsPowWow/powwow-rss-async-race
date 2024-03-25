import type { Either } from '@sweet-monads/either';
import { fromPromise } from '@sweet-monads/either';
import { parse } from 'valibot';

import type { CarsResponse } from './types.ts';
import { CarsResponseSchema } from './types.ts';

const API_URL = import.meta.env.VITE_RACE_API_URL;

export const getCars = async (): Promise<
  Either<
    Error,
    Array<{
      id: number;
      name: string;
      color: string;
    }>
  >
> => {
  return fromPromise<Error, CarsResponse>(
    fetch(`${API_URL}/garage`, { method: 'GET' })
      .then((r) => r.json())
      .then((data) => parse(CarsResponseSchema, data)),
  );
};

// apiStartSecondBtn.element.addEventListener('click', () => {
//   console.log('Check start 2nd Engine Api...');
//   fetch('http://localhost:3000/engine?id=2&status=started', { method: 'PATCH' })
//     .then((res) => res.json())
//     .then((res) => {
//       console.log(res);
//     });
// });
