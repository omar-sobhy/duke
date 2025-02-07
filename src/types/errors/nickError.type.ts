import { Error } from '../result.type';

export class NickError implements Error<string> {
  type = 'error' as const;
  message: string;
  data: string;

  constructor(nickname: string) {
    this.message = `Could not change nickname to '${nickname}'`;
    this.data = nickname;
  }
}
