import type { Duke } from "../duke.js";
import type { PrivmsgCommand } from "../privmsgCommand.js";
import { CommandHandler } from "./CommandHandler.js";

export class RefreshHandler extends CommandHandler {
    public readonly commandName = 'refresh';

    override permissionLevel(): number {
        return 10;
    }

    help(): string {
        const p = this.duke.config.privmsgCommandPrefix;

        return `Refreshes the user list. Usage: ${p}${this.commandName}`;
    }

    async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
        return command.command.toLowerCase() === this.commandName;
    }

    async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
        await duke.fetchAndSendUsers();
        command.privmsg.reply('Done.');
    }
}