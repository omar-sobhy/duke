import type { Duke } from '../duke';
import { PrivmsgCommand } from '../privmsgCommand';

export abstract class CommandHandler {
  /**
   * Creates a new CommandHandler.
   *
   * @param duke The Duke instance.
   */
  constructor(public readonly duke: Duke) {}

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
}
