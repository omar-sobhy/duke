import { userPermissionModel } from '../../database/models/userpermission.model.js';
import type { Duke } from '../duke.js';
import type { PrivmsgCommand } from '../privmsgCommand.js';
import { CommandHandler } from './CommandHandler.js';
import wildcardMatch from 'wildcard-match';

export class PermissionHandler extends CommandHandler {
  public readonly commandName = 'permission';

  private hostRegex = /[a-zA-Z0-9\*\?\[\]\\`{}\-_|]+![a-zA-Z0-9\*\?\~\_\-\.]+@[a-zA-Z0-9\*\?\.\-:]/;

  help(): string {
    const p = this.duke.config.privmsgCommandPrefix;

    return `Adds permissions. Usage: ${p}permission [add|delete] <mask> [level].`;
  }

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === this.commandName;
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    const p = this.duke.config.privmsgCommandPrefix;

    const _userPermissionModel = userPermissionModel(duke.config.database);

    const maxLevel = duke.config.maxPermissionLevel;

    const prefix = `${p}${this.commandName}`;

    const params = command.privmsg.text.substring(prefix.length).trim().split(' ');

    const allPermissions = await _userPermissionModel.find();

    if (params.length === 0 || params[0].length === 0) {
      const permission = allPermissions.find((perm) => {
        return (
          perm.serverName === command.privmsg.client.serverName &&
          wildcardMatch(perm.mask)(command.privmsg.sender.toString().toLowerCase())
        );
      });

      command.privmsg.reply(`Your permission level is ${permission?.level ?? 0}.`);
      return;
    }

    const actionOrUser = params[0].toLowerCase();

    let user = (['add', 'delete'].includes(actionOrUser) ? params[1] : params[0]).toLowerCase();

    if (!user.includes('!')) {
      user = `${user}!*@*`;
    }

    const existingPermission = allPermissions.find((perm) => {
      return perm.serverName === command.privmsg.client.serverName && wildcardMatch(user)(perm.mask.toLowerCase());
    });

    if (actionOrUser !== 'add' && actionOrUser !== 'delete') {
      command.privmsg.reply(`User ${actionOrUser} has permission level ${existingPermission?.level ?? 0}.`);
      return;
    }

    if (params.length < 3) {
      command.privmsg.reply(`Usage: ${p}permission [add|delete] <mask> [level]`);
      return;
    }

    const callerPermission = allPermissions.find((perm) => {
      return (
        perm.serverName === command.privmsg.client.serverName &&
        wildcardMatch(perm.mask)(command.privmsg.sender.toString().toLowerCase())
      );
    });


    if (!callerPermission || (existingPermission && callerPermission.level < existingPermission.level)) {
      command.privmsg.reply('You cannot modify the permissions of a user with a higher permission level than you.');
      return;
    }

    const mask = params[1].toLowerCase();

    if (actionOrUser === 'add') {
      const level = parseInt(params[2], 10);

      if (isNaN(level) || level < 1 || level > maxLevel) {
        command.privmsg.reply(`Invalid level. Level must be a number between 1 and ${maxLevel}.`);
        return;
      }

      if (!this.hostRegex.test(mask)) {
        command.privmsg.reply(`Invalid mask format. Must be in the format user!host@server.`);
        return;
      }

      if (existingPermission) {
        existingPermission.level = level;
        existingPermission.mask = mask.toLowerCase();
        await _userPermissionModel.updateOne({ _id: existingPermission._id }, existingPermission);
        command.privmsg.reply(`Updated permission for user ${mask} to level ${level}.`);
      } else {
        await _userPermissionModel.insertOne({
          serverName: command.privmsg.client.serverName,
          mask: mask.toLowerCase(),
          level,
        });
        command.privmsg.reply(`Added permission for user ${mask} with level ${level}.`);
      }
    } else {
      if (!existingPermission) {
        command.privmsg.reply(`No existing permission found for user ${mask}.`);
        return;
      }

      await _userPermissionModel.deleteOne({ _id: existingPermission._id });
      command.privmsg.reply(`Deleted permission for user ${mask}.`);
    }
  }
}
