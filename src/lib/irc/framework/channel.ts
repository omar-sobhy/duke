import { Client } from './client.js';

export class Channel {
  constructor(
    public readonly client: Client,
    public readonly name: string,
    public readonly password?: string,
  ) {}
}
