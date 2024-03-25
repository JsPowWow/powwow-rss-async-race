export type JSONResponse<Data> = {
  data?: Data;
  errors?: Array<{ message: string }>;
};

export const getResponseError = (message: string, errors?: Array<{ message: string }>) => {
  const error = new Error(message);
  error.cause = errors;
  return error;
};
