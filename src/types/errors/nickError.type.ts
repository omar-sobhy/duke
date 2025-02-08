import { Failure } from '../result.type.js';

export class NickError extends Failure<string> {
  constructor(nickname: string) {
    super(`Could not change nickname to '${nickname}'`, nickname);
  }
}
