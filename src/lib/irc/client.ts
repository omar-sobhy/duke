import { Socket } from 'node:net';
import { createInterface } from 'node:readline/promises';
import { Channel } from './channel';
import { ReadLine } from 'node:readline';
import { Err, Ok, Result } from '../../types/result.type';
import { NickError } from '../../types/errors/nickError.type';
import { NotConnectedError } from '../../types/errors/notConnectedError.type';

export interface ClientOptions {
  host: string;
  port: number;
  logging?: boolean;
  serverName: string;
  nickname?: string;
  channels?: Channel[];
  autotryNextNick?: boolean;
  autotryNextNickTries?: number;
}

const defaultOptions: Pick<
  ClientOptions,
  | 'logging'
  | 'channels'
  | 'nickname'
  | 'autotryNextNick'
  | 'autotryNextNickTries'
> = {
  channels: [],
  logging: false,
  nickname: 'Duke',
  autotryNextNick: true,
  autotryNextNickTries: 3,
};

/**
 * Represents a client to a single IRC Server
 */
export class Client {
  private socket: Socket;
  private readline?: ReadLine;

  channels: Channel[] = [];

  /**
   * Creates a new Client with the specified options
   *
   * Defaults values:
   *
   * `options.logging`: false
   *
   * `options.nickname`: Duke
   *
   * `options.channels`: []
   */
  constructor(private options: ClientOptions) {
    this.options = { ...defaultOptions, ...options };

    this.socket = new Socket();
    this.socket.setEncoding('utf-8');
  }

  /**
   * Initiates the connection to the server
   *
   * @returns {Promise<this>} The client
   */
  public async connect(): Promise<this> {
    return new Promise((resolve, reject) => {
      this.socket.connect({
        host: this.options.host,
        port: this.options.port,
      });

      const errorListener = (err: Error) => {
        reject(err);

        this.socket.off('error', errorListener);
      };

      const connectListener = () => {
        this.readline = createInterface({
          input: this.socket,
          crlfDelay: Infinity,
        });
      };

      this.socket.on('error', errorListener);

      this.socket.on('connect', connectListener);

      resolve(this);
    });
  }

  /**
   *
   * @param data The data to send to the server
   * @param crlf Whether to ensure '\r\n' is sent (will not double-send if `data` already ends with it)
   *
   * @returns {Promise<this>} The client
   */
  public async writeRaw(
    data: string,
    crlf = true,
  ): Promise<Result<this, Error>> {
    if (this.readline) {
      if (!data.endsWith('\r\n') && crlf) {
        data = data + '\r\n';
      }

      this.readline.write(data);

      return Ok(this);
    }

    return new NotConnectedError();
  }

  private async _nick(
    nickname: string,
    tries = 0,
  ): Promise<Result<this, NickError | Error>> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const nickListener = (line: string) => {
        const nickInUseRegexp = new RegExp(`:`);

        if (line.match(nickInUseRegexp)) {
          resolve(Ok(this));
        }

        this.readline?.off('line', nickListener);
      };

      this.readline?.on('line', nickListener);

      const result = await this.writeRaw(`:NICK ${nickname}`);
      if (result.type === 'error') {
        resolve(result);
      }
    });
  }

  /**
   *
   * @param nickname The new nickname of the client
   *
   * @returns
   */
  public async nick(
    nickname: string,
  ): Promise<Result<this, NickError | Error>> {
    return this._nick(nickname);
  }
}
