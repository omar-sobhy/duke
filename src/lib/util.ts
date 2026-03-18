import z, { ZodError } from 'zod';
import type { PrivmsgCommand } from './duke/privmsgCommand.js';
import type { Logger } from 'winston';

export function capitalize(word: string): string {
  const first = word[0];
  const rest = word.slice(1);
  return `${first.toUpperCase()}${rest}`;
}

export async function logErrorAndReply(
  e: unknown,
  command: PrivmsgCommand,
  logger: Logger,
): Promise<void> {
  const toLog = e instanceof ZodError ? JSON.stringify(z.treeifyError(e)) : JSON.stringify(e);

  const message = e instanceof ZodError ? 'Received invalid response from API.' : 'Unknown error.';

  logger.error(toLog);

  return void command.privmsg.reply(message);
}
