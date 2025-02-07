import { Error } from '../result.type';

export class NotConnectedError implements Error<string> {
  type = 'error' as const;
  message: string;

  constructor() {
    this.message = 'Not connected.';
  }
}
