export class Failure<T> extends Error {
  public readonly type = 'error' as const;

  constructor(
    public readonly message: string,
    public readonly data?: T,
  ) {
    super(message);
  }
}

export interface Success<T = undefined> {
  type: 'success';
  data: T;
}

export type Result<T = unknown, E = unknown> = Success<T> | Failure<E>;

export function Ok(): Success<undefined>;

export function Ok<T>(data: T): Success<T>;

export function Ok<T>(data?: T): Success<T | undefined> {
  return {
    type: 'success',
    data: data,
  };
}

export function Err<T = unknown>(message: string, data?: T): Failure<T> {
  return new Failure(message, data);
}
