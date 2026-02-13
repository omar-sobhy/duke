import Joi from 'joi';
import type { UserPermission } from '../database/models/userpermission.model.js';

export interface ClientConfig {
  nickname: string;
  logging: boolean;
  host: string;
  port: number;
  serverName: string;
  throttleInterval: number;
  initialChannels?: { name: string; password?: string }[];
  username?: string;
  wallops?: boolean;
  invisible?: boolean;
  realName?: string;
  autotryNextNick?: boolean;
  maxAutotryNextNickTries?: number;
  initPermissions: Omit<UserPermission, 'serverName'>[];
}

export interface RootConfig {
  clients: ClientConfig[];
  privmsgCommandPrefix: string;
  databaseHost: string;
  openRouterKey: string;
  maxPermissionLevel: number;
}

export const configSchema = Joi.object<RootConfig>({
  clients: Joi.array().items(
    Joi.object<ClientConfig>({
      nickname: Joi.string().alphanum().min(1).max(30).required(),
      logging: Joi.boolean().default(false),
      host: Joi.string().min(1).required(),
      port: Joi.number().min(1000).required(),
      serverName: Joi.string().min(1).required(),
      initialChannels: Joi.array().items(
        Joi.object({
          name: Joi.string().min(1).required(),
          password: Joi.string().min(1),
        }),
      ),
      username: Joi.string().alphanum().min(1),
      realName: Joi.string().alphanum().min(1),
      autotryNextNick: Joi.boolean().default(false),
      invisible: Joi.boolean().default(false),
      wallops: Joi.boolean().default(false),
      maxAutotryNextNickTries: Joi.number().min(1),
      throttleInterval: Joi.number().min(1).default(200),
      initPermissions: Joi.array()
        .items(
          Joi.object<Omit<UserPermission, 'serverName'>>({
            level: Joi.number().min(1).required().max(100),
            mask: Joi.string().required(),
          }),
        )
        .optional(),
    }).required(),
  ),
  privmsgCommandPrefix: Joi.string().min(1).default('!'),
  databaseHost: Joi.string().required(),
  openRouterKey: Joi.string().required(),
});
