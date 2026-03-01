import { SystemMessage, AssistantMessage, UserMessage } from '@openrouter/sdk/esm/models';
import { Duke } from '../duke.js';
import { CommandHandler } from './CommandHandler.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import yargs from 'yargs';
import type { ChatMessage } from '../../../types/database/chatmessage.database.type.js';

export class ChatHandler extends CommandHandler {
  private processing = new Set<string>();

  public readonly commandName = 'chat';

  help(): string {
    const p = this.duke.config.privmsgCommandPrefix;

    return (
      `Chat with the AI model. Usage: ${p}` +
      `chat [--clear|-c] [--name|-n <context name>] <message>.\n` +
      `--clear: Clears the chat context.\n` +
      `--name: Uses or creates a named channel-wide chat context.`
    );
  }

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === this.commandName;
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    if (!duke.openRouter) {
      command.privmsg.reply('An error occurred while initialising OpenRuter.');
      return;
    }

    // shitty code to get the right text excluding the command prefix
    let text = command.privmsg.text;
    if (text.startsWith(duke.config.privmsgCommandPrefix)) {
      const prefix = `${duke.config.privmsgCommandPrefix}${this.commandName}`;
      text = text.substring(prefix.length).trim();
    } else {
      text = text.substring(command.privmsg.client.getNickname().length);
      if ([':', ','].includes(text.charAt(0))) {
        text = text.substring(1).trim();
      }
    }

    const args = await yargs(text)
      .options({
        c: {
          alias: 'clear',
          type: 'boolean',
        },
        n: {
          alias: 'name',
          type: 'string',
        },
      })
      .help(false)
      .parserConfiguration({ 'halt-at-non-option': true })
      .parse();

    const identifier = args.n ? args.n : command.privmsg.target;

    if (this.processing.has(identifier)) {
      await command.privmsg.reply(
        'A chat request is already being processed for this context. Please wait.',
      );

      return;
    }

    try {
      this.processing.add(identifier);

      let chatContext = await duke.config
        .database('chatContexts')
        .where({
          type: 'channel',
          identifier,
        })
        .first();

      if (!chatContext) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        chatContext = (await duke.config.database('chatContexts').insert({
          type: 'channel',
          identifier,
        }))!;
      }

      if (args.c) {
        await duke.config
          .database('chatMessages')
          .where({ contextIdentifier: chatContext.identifier })
          .delete();

        await command.privmsg.reply('Chat context cleared.');
      }

      if (args._.length === 0) {
        if (!args.c) {
          await command.privmsg.reply(
            `Usage: ${duke.config.privmsgCommandPrefix}chat [--clear|-c] [--name|-n <context name>] <message>.`,
          );
        }

        return;
      }

      const previousMessages = await duke.config
        .database('chatMessages')
        .where({ contextIdentifier: chatContext.identifier })
        .orderBy('id', 'asc');

      const input = args._.join('_');

      const continueRequested = input.toLowerCase().startsWith('continue');

      if (continueRequested) {
        const last = previousMessages[previousMessages.length - 1];

        if (!last) {
          await command.privmsg.reply("There's nothing to continue for this context.");

          return;
        }

        const regex = new RegExp(`.{1,400}`, 'gs');

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const split = last.text.match(regex)!;

        if (last.splitIndex === split.length) {
          await command.privmsg.reply("There's nothing to continue for this context.");

          return;
        }

        const nextContent = split[last.splitIndex];

        const formatted = nextContent
          .split('\n')
          .map((line) => line.trim())
          .join(' ');

        await command.privmsg.reply(formatted);

        await duke.config
          .database('chatMessages')
          .where({ id: last.id })
          .update({ splitIndex: last.splitIndex + 1 });

        return;
      }

      try {
        const messages: (SystemMessage | UserMessage | AssistantMessage)[] = [
          {
            role: 'system',
            content:
              'You are an IRC bot. Try to be helpful in your responses. If you do not know the answer to a question, say you do not know. Responses should be in pure plaintext -- do not use markdown or similar.',
          },
        ];

        previousMessages.forEach((m) => {
          messages.push({ role: 'user', content: m.input });

          messages.push({
            role: 'assistant',
            content: m.text,
          });
        });

        messages.push({ role: 'user', content: args._.join(' ') });

        const completion = await duke.openRouter.chat.send({
          model: 'openai/gpt-4.1-mini',
          messages,
        });

        const choice = completion.choices[0];

        const content = choice.message.content;

        if (typeof content !== 'string') {
          await command.privmsg.reply('Error: received non-text content response.');

          return;
        }

        const regex = new RegExp(`.{1,400}`, 'gs');

        const output = content.match(regex);

        if (!output) {
          await command.privmsg.reply('An OpenRouter error occurred.');

          return;
        }

        const first = output[0];

        const formatted = first
          .split('\n')
          .map((line) => line.trim())
          .join(' ');

        await command.privmsg.reply(formatted);

        await duke.config.database('chatMessages').insert({
          contextIdentifier: chatContext.identifier,
          input: args._.join(' '),
          text: content,
          splitIndex: 1,
        });
      } catch (error) {
        console.error(error);

        await command.privmsg.reply('An OpenRouter error occurred.');
      }
    } finally {
      this.processing.delete(identifier);
    }
  }
}
