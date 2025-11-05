interface PrefixOptions {
  readonly serverName?: string;
  readonly nickname?: string;
  readonly user?: string;
  readonly host?: string;
}

export class Prefix {
  public readonly serverName?: string;
  public readonly nickname?: string;
  public readonly user?: string;
  public readonly host?: string;

  private constructor(options: PrefixOptions) {
    this.serverName = options.serverName;
    this.nickname = options.nickname;
    this.user = options.user;
    this.host = options.host;
  }

  public static parse(rawPrefix: string): Prefix {
    rawPrefix = rawPrefix.substring(1);

    const data = rawPrefix.split('@');
    if (data.length === 1) {
      return new Prefix({
        serverName: data[0],
      });
    }

    const [rest, host] = data;
    if (rest.includes('!')) {
      const [nickname, user] = rest.split('!');
      return new Prefix({
        nickname,
        user, // TODO users prefixed with ~ aren't running identd?
        host,
      });
    }

    return new Prefix({
      nickname: rest,
      host,
    });
  }

  public toString(): string {
    if (this.serverName) {
      return this.serverName;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let retval = this.nickname!;

    if (this.user) {
      retval += `!${this.user}`;
    }

    if (this.host) {
      retval += `@${this.host}`;
    }

    return retval;
  }
}
