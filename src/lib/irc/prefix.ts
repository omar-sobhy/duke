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
    const data = rawPrefix.split(' ');
    if (data.length === 1) {
      return new Prefix({
        serverName: data[0],
      });
    }

    const [rest, host] = rawPrefix.split('@');
    if (rest.includes('!')) {
      const [nickname, user] = rest.split('!');
      return new Prefix({
        nickname,
        user,
        host,
      });
    }

    return new Prefix({
      nickname: rest,
      host,
    });
  }
}
