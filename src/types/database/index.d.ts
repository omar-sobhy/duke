import type { IrcUser } from './ircuser.database.type.js';
import type { ChatContext } from './chatcontext.database.type.js';
import type { ChatMessage } from './chatmessage.database.type.js';
import type { Player } from './player.database.type.js';
import type { UserPermission } from './userpermission.database.type.js';
import type { Skill } from './playerskill.database.type.js';

declare module 'knex/types/tables' {
  interface Tables {
    users: IrcUser;
    chatContexts: ChatContext;
    chatMessages: ChatMessage;
    players: Player;
    userPermissions: UserPermission;
    skills: Skill;
  }
}
