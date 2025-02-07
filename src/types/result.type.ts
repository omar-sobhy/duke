export interface Error<T> {
  type: 'error';
  message: string;
  data?: T;
}

export interface Success<T> {
  type: 'success';
  data?: T;
}

export type Result<T, E = unknown> = Success<T> | Error<E>;

export function Ok<T>(data?: T): Success<T> {
  return {
    type: 'success',
    data,
  };
}

export function Err<T = unknown>(message: string, data?: T): Error<T> {
  return {
    type: 'error',
    message,
    data,
  };
}
