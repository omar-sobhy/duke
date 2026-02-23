import { SystemMessage, AssistantMessage, UserMessage } from '@openrouter/sdk/esm/models';
import { chatContextModel } from '../../database/models/chatcontext.model.js';
import { Duke } from '../duke.js';
import { CommandHandler } from './CommandHandler.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import yargs from 'yargs';

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

    const _chatContextModel = chatContextModel(duke.config.database);

    const identifier = args.n ? args.n : command.privmsg.target;

    if (this.processing.has(identifier)) {
      await command.privmsg.reply(
        'A chat request is already being processed for this context. Please wait.',
      );

      return;
    }

    let chatContext = await _chatContextModel.findOne({
      type: 'channel',
      identifier,
    });

    if (!chatContext) {
      chatContext = await _chatContextModel.create({
        type: 'channel',
        identifier,
        messages: [],
      });
    }

    if (args.c) {
      chatContext.messages = [];
      await chatContext.save();

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

    const messages: (SystemMessage | UserMessage | AssistantMessage)[] = [
      {
        role: 'system',
        content:
          'You are an IRC bot. Try to be helpful in your responses. If you do not know the answer to a question, say you do not know. Responses should be in pure plaintext -- do not use markdown or similar.',
      },
    ];

    chatContext.messages.forEach((m) => {
      messages.push({ role: 'user', content: m.input });

      const previous = m.output.join('');

      messages.push({
        role: 'assistant',
        content: previous,
      });
    });

    const input = args._.join('_');

    const continueRequested = input.toLowerCase().startsWith('continue');

    const last = chatContext.messages[chatContext.messages.length - 1];
    if (continueRequested && last.nextIndex === last.output.length) {
      await command.privmsg.reply("There's nothing to continue for this context.");

      return;
    } else if (continueRequested) {
      const nextContent = last.output[last.nextIndex];

      await command.privmsg.reply(nextContent.trim());

      last.nextIndex++;

      await chatContext.save();

      return;
    } else {
      messages.push({ role: 'user', content: args._.join(' ') });
    }

    try {
      this.processing.add(identifier);

      const completion = await duke.openRouter.chat.send({
        model: 'openai/gpt-4.1-mini',
        messages,
      });

      const choice = completion.choices[0];

      const content = choice.message.content;

      if (typeof content !== 'string') {
        await command.privmsg.reply('Error: received non-text content response.');

        this.processing.delete(identifier);

        return;
      }

      const regex = new RegExp(`.{1,490}`, 'gs');

      const output = content.match(regex);

      if (!output) {
        await command.privmsg.reply('An OpenRouter error occurred.');
        this.processing.delete(identifier);
        return;
      }

      const first = output[0];

      const formatted = first.split('\n').map(line => line.trim()).join(' ');

      await command.privmsg.reply(formatted);

      chatContext.messages.push({
        input,
        nextIndex: 1,
        output: output,
      });

      await chatContext.save();
    } catch (error) {
      console.error(error);
      await command.privmsg.reply('An OpenRouter error occurred.');
    }

    this.processing.delete(identifier);
  }
}
