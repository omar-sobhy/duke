import type { Duke } from '../duke.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import { userPermissionModel } from '../../database/models/userpermission.model.js';
import wildcardMatch from 'wildcard-match';

export abstract class CommandHandler {
  permissionLevel(): number {
    return 0;
  }

  /**
   * Creates a new CommandHandler.
   *
   * @param duke The Duke instance.
   */
  constructor(public readonly duke: Duke) { }

  /**
   * Returns a help string for the command.
   *
   * When the help command is issued with a specific command name
   * (e.g., !help chat), that specific command's help() method is called with
   * the text after the command name as an argument.
   *
   * @param args Optional arguments passed after the command name.
   * @returns The help string.
   */
  abstract help(args?: string): string;

  /**
   * The name of the command this handler handles.
   */
  abstract readonly commandName: string;

  /**
   * Returns whether this handler matches the given command.
   *
   * @param duke The Duke instance.
   * @param command The privmsg command to match against.
   *
   * @returns Whether this handler matches the given command.
   */
  abstract match(duke: Duke, command: PrivmsgCommand): Promise<boolean>;

  /**
   * Perform the command's action.
   *
   * @param duke The Duke instance.
   * @param command The privmsg command to handle.
   */
  abstract handle(duke: Duke, command: PrivmsgCommand): Promise<void>;

  /**
   *
   * Checks the permissions of the user aginst the command's required permissions.
   *
   * @param duke The Duke instance.
   * @param command The privmsg command.
   */
  async checkPermission(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    if (this.permissionLevel() === 0) {
      return true;
    }

    const _userPermissionModel = userPermissionModel(duke.config.database);

    const permissions = await _userPermissionModel.find();

    const sender = command.privmsg.sender.toString().toLowerCase();

    for (const p of permissions) {
      const matches = wildcardMatch(p.mask.toLowerCase());

      if (matches(sender) && p.level >= this.permissionLevel()) {
        return true;
      }
    }

    return false;
  }
}
