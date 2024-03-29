export const ErrorStatus = {
  WrongParams: 400,
  NotFound: 404,
  DriveInProgress: 429,
  CarBrokeDown: 500,
};

const throwCarResponseError = (errCarId: number, errMessage: string, errStatus: number): void => {
  throw new (class CarResponseError extends Error {
    public carId: number;

    public status: number;

    constructor(message: string, carId: number, status: number) {
      super(message);
      this.name = 'CarResponseError';
      this.status = status;
      this.carId = carId;
    }
  })(errMessage, errCarId, errStatus);
};

export const validateResponseStatus =
  (carId: number) =>
  async (r: Response): ReturnType<Response['json']> => {
    if (!r.ok) {
      const errText: string = await r.text();
      throwCarResponseError(carId, errText, r.status);
    }
    return r.json();
  };
