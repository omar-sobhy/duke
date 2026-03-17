import * as z from 'zod';

export const zConfig = z.object({
  clients: z.array(
    z.object({
      nickname: z.string().regex(/[a-z0-9]+/),
      logging: z.boolean().default(false),
      host: z.string().min(1),
      port: z.number().min(1000),
      serverName: z.string().min(1),
      initialChannels: z.array(
        z.object({
          name: z.string().min(1),
          password: z.string().min(1).optional(),
        }),
      ),
      username: z.string().regex(/[a-z0-9]+/),
      realName: z.string().regex(/[a-z0-9]+/),
      autoTryNextNick: z.boolean().default(false),
      invisible: z.boolean().default(false),
      wallops: z.boolean().default(false),
      maxAutoTryNextNickTries: z.number().min(1),
      throttleInterval: z.number().min(1).default(200),
      initPermissions: z.array(
        z.object({
          level: z.number().min(1).max(100),
          mask: z.string(),
        }),
      ),
    }),
  ),
  privmsgCommandPrefix: z.string().min(1).default('!'),
  databaseConfig: z.object({
    user: z.string(),
    password: z.string(),
    host: z.string(),
    port: z.number().min(1000),
    database: z.string(),
  }),
  openRouterKey: z.string(),
  openWeatherMapKey: z.string(),
  mapBoxKey: z.string(),
});

export type ClientConfig = z.infer<typeof zConfig>['clients'][number];

export type RootConfig = z.infer<typeof zConfig>;
