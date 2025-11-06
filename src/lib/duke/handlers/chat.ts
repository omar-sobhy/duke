import { AssistantMessage, UserMessage } from '@openrouter/sdk/esm/models';
import { chatContextModel } from '../../database/models/chatcontext.model.js';
import { Duke } from '../duke.js';
import { CommandHandler } from './CommandHandler.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import yargs from 'yargs';

export class ChatHandler extends CommandHandler {
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

    const args = await yargs(command.params.join(' '))
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
      .parserConfiguration({
        'halt-at-non-option': true,
      })
      .parse();

    const _chatContextModel = chatContextModel(duke.config.database);

    let chatContext;
    if (args.n) {
      chatContext = await _chatContextModel.findOne({
        type: 'channel',
        identifier: args.n,
      });
    } else {
      chatContext = await _chatContextModel.findOne({
        type: 'user',
        identifier: command.privmsg.sender.nickname,
      });
    }

    if (!chatContext) {
      chatContext = await _chatContextModel.create({
        type: args.n ? 'channel' : 'user',
        identifier: args.n ? args.n : command.privmsg.sender.nickname,
        messages: [],
      });
    }

    if (args.c) {
      chatContext.messages = [];
      await chatContext.save();

      await command.privmsg.reply('Chat context cleared.');
    }

    const messages: (UserMessage | AssistantMessage)[] =
      chatContext.messages.flatMap((m) => [
        { role: 'user', content: m.input },
        {
          role: 'assistant',
          content: m.output.content,
          status: 'completed',
          id: m.output.id,
          reasoningDetails: m.output.reasoningDetails,
        },
      ]);

    messages.push({ role: 'user', content: args._.join(' ') });

    try {
      const completion = await duke.openRouter.chat.send({
        model: 'openrouter/auto',
        messages,
        maxCompletionTokens: 64,
      });

      const content = completion.choices[0].message.content;
      if (typeof content === 'string') {
        await command.privmsg.reply(content.substring(0, 256 * 3));

        chatContext.messages.push({
          input: command.params.join(' '),
          output: {
            id: completion.id,
            content: content,
            reasoningDetails: 'Response generated using openrouter/auto model.',
          },
        });
        await chatContext.save();
      } else {
        await command.privmsg.reply(
          'Error: received non-text content response.',
        );
      }
    } catch (error) {
      console.error(error);
      await command.privmsg.reply('An OpenRouter error occurred.');
    }
  }
}
