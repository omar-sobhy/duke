import { Failure } from '../result.type.js';

export class NotConnectedError extends Failure<string> {
  constructor() {
    super('Not connected.');
  }
}
