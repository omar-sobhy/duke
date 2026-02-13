import { Socket } from 'node:net';
import { createInterface } from 'node:readline/promises';
import { ReadLine } from 'node:readline';
import { EventEmitter } from 'node:events';
import { Channel } from './channel.js';
import { Ok, Result } from '../../../types/result.type.js';
import { NickError } from '../../../types/errors/nickError.type.js';
import { NotConnectedError } from '../../../types/errors/notConnectedError.type.js';
import { Message } from './message/message.js';
import { NumericReplies } from './message/numericReplies.js';
import { Events } from './events.js';
import { Commands } from './commands.js';
import { Privmsg } from '../privmsg.js';
import type { WriteRawOpts } from '../../../types/client/writeRawOpts.type.js';
import type { ClientConfig } from '../../duke/config.js';

const defaultOptions: Required<
  Pick<
    ClientConfig,
    | 'logging'
    | 'initialChannels'
    | 'nickname'
    | 'autotryNextNick'
    | 'maxAutotryNextNickTries'
    | 'wallops'
    | 'invisible'
  >
> = {
  initialChannels: [],
  logging: false,
  nickname: 'Duke',
  autotryNextNick: true,
  maxAutotryNextNickTries: 3,
  wallops: false,
  invisible: false,
};

/**
 * Represents a client to a single IRC Server
 */
export class Client extends EventEmitter<Events> {
  public readonly serverName: string;
  public readonly socket: Socket;
  
  private readline?: ReadLine;

  private readonly logging: boolean;
  private nickname: string;
  private username: string;
  private realName: string;
  private wallops: boolean;
  private invisible: boolean;

  public channels: Channel[] = [];

  private readonly queue: { data: string; writeRawOpts?: WriteRawOpts }[] = [];

  private last: number = Date.now();

  private sending = false;

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
   *
   * `options.throttleInterval`: 100
   */
  constructor(private options: ClientConfig) {
    super();
    
    this.serverName = options.serverName;
    
    this.logging = options.logging ?? defaultOptions.logging;
    this.nickname = options.nickname ?? defaultOptions.nickname;
    this.username = options.username ?? this.nickname;
    this.realName = options.realName ?? this.nickname;
    this.wallops = options.wallops ?? defaultOptions.wallops;
    this.invisible = options.invisible ?? defaultOptions.invisible;

    this.socket = new Socket();
    this.socket.setEncoding('utf-8');

    this.addListener('RawMessage', (message) => {
      if (this.logging) {
        console.log(`>>> ${message}`);
      }

      const parsedMessage = Message.parse(message, this);

      if (parsedMessage.command === Commands.PRIVMSG) {
        const privmsgResult = Privmsg.parse(parsedMessage, this);

        if (privmsgResult.type === 'success') {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const privmsg = privmsgResult.data!;

          this.emit('Privmsg', privmsg);
        }
      }
    });

    setInterval(() => {
      if (this.sending) {
        return;
      }

      this.sending = true;

      const now = Date.now();

      if (now - this.last < this.options.throttleInterval) {
        this.sending = false;
        return;
      }

      const next = this.queue.shift();

      if (!next) {
        this.sending = false;
        return;
      }

      const opts = next.writeRawOpts ? { ...next.writeRawOpts } : { throttle: false };
      opts.throttle = false;

      this.writeRaw(next.data, next.writeRawOpts).then(() => (this.sending = false));
    }, 50);
  }

  private user() {
    let mode = 0;

    if (this.wallops) {
      mode += 4;
    }

    if (this.invisible) {
      mode += 8;
    }

    this.writeRaw(`USER ${this.username ?? this.nickname} ${mode} * :${this.realName}`);
  }

  /**
   * Initiates the connection to the server
   *
   * @returns {Promise<this>} The client
   */
  public async connect(): Promise<this> {
    return new Promise((resolve, reject) => {
      const errorListener = (err: Error) => {
        reject(err);

        this.socket.off('error', errorListener);
      };

      const connectListener = () => {
        this.readline = createInterface({
          input: this.socket,
          crlfDelay: Infinity,
        });

        this.readline.on('line', (line) => {
          this.emit('RawMessage', line);

          const message = Message.parse(line, this);

          if (message.command === Commands.PING.toString()) {
            this.emit('Ping');

            const serverName = message.trailing;

            this.writeRaw(`PONG ${serverName}`);
          } else if (message.command === NumericReplies.RPL_WELCOME.toString()) {
            const channelNames = this.options.initialChannels?.map((c) => c.name) ?? [];
            const passwords = this.options.initialChannels?.map((c) => c.password) ?? [];

            this.join(channelNames, passwords);
          }
        });

        const initialNickListener = () => {
          this.readline?.off('line', initialNickListener);

          this._nick(this.nickname, true);

          this.user();
        };

        this.readline.on('line', initialNickListener);
      };

      this.socket.on('error', errorListener);

      this.socket.on('connect', connectListener);

      this.socket.connect(
        {
          host: this.options.host,
          port: this.options.port,
        },
        () => {
          resolve(this);
        },
      );
    });
  }

  /**
   *
   * @param data The data to send to the server
   * @param crlf Whether to ensure '\r\n' is sent (will not double-send if `data` already ends in crlf)
   *
   * @returns {Promise<this>} The client
   */
  public async writeRaw(data: string, opts?: WriteRawOpts): Promise<Result<this>> {
    const { crlf = true, throttle = false } = opts ?? {};

    if (!this.readline) {
      return new NotConnectedError();
    }

    if (crlf && !data.endsWith('\r\n')) {
      data += '\r\n';
    }

    if (throttle) {
      this.queue.push({ data });

      return Ok(this);
    }

    this.socket.write(data);
    this.emit('RawSend', data);
    this.last = Date.now();

    return Ok(this);
  }

  private async _nick(nickname: string, initialConnect = false, tries = 0): Promise<Result<this>> {
    if (tries === this.options.maxAutotryNextNickTries) {
      return new NickError(nickname);
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const nickListener = (line: string) => {
        const message = Message.parse(line, this);

        if (message.command === NumericReplies.ERR_NICKNAMEINUSE.toString()) {
          this.readline?.off('line', nickListener);

          return this._nick(nickname + '0', initialConnect, tries + 1);
        } else if (message.command === NumericReplies.RPL_WELCOME.toString()) {
          resolve(Ok(this));
          this.nickname = nickname;
        } else if (
          message.command === Commands.NICK.toString() &&
          message.prefix?.nickname === this.nickname &&
          message.params?.[0] === nickname
        ) {
          resolve(Ok(this));
          this.nickname = nickname;
        }
      };

      this.readline?.on('line', nickListener);

      const result = await this.writeRaw(`NICK ${nickname}`);
      if (result.type === 'error') {
        reject(result);
      }
    });
  }

  /**
   *
   * @param nickname The new nickname of the client
   *
   * @returns
   */
  public async nick(nickname: string): Promise<Result<this>> {
    return this._nick(nickname);
  }

  public async join(channelName: string, password?: string): Promise<void>;

  public async join(channelNames: string[], passwords?: (string | undefined)[]): Promise<void>;

  public async join(channelNames: string | string[], passwords?: string | (string | undefined)[]) {
    if (typeof channelNames === 'string') {
      if (passwords) {
        const passwordsArr = Array.isArray(passwords) ? passwords : [passwords];

        this.writeRaw(`JOIN ${channelNames} ${passwordsArr.join(',')}`);
      } else {
        this.writeRaw(`JOIN ${channelNames}`);
      }
    } else {
      if (passwords) {
        const passwordsArr = Array.isArray(passwords) ? passwords : [passwords];

        this.writeRaw(`JOIN ${channelNames.join(',')} ${passwordsArr.join(',')}`);
      } else {
        this.writeRaw(`JOIN ${channelNames.join(',')}`);
      }
    }
  }

  public async disconnect() {
    this.writeRaw('QUIT');
  }

  public getNickname(): string {
    return this.nickname;
  }
}
