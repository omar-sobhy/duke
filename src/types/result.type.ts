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
  data?: T;
}

export type Result<T = unknown, E = unknown> = Success<T> | Failure<E>;

export function Ok<T = undefined>(data?: T): Success<T> {
  return {
    type: 'success',
    data,
  };
}

export function Err<T = unknown>(message: string, data?: T): Failure<T> {
  return new Failure(message, data);
}
