import { AssistantMessage, UserMessage } from '@openrouter/sdk/esm/models';
import { chatContextModel } from '../../database/models/chatcontext.model';
import { CommandHandler, Duke } from '../duke';
import { PrivmsgCommand } from '../privmsgCommand';
import yargs from 'yargs';

export class ChatHandler implements CommandHandler {
  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command === 'chat';
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    if (!duke.openRouter) {
      command.privmsg.reply('An error occurred while initialising OpenRuter.');
      return;
    }

    const args = await yargs(command.privmsg.text)
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
        identifier: command.privmsg.sender.user,
      });
    }

    if (!chatContext) {
      chatContext = await _chatContextModel.create({
        type: args.n ? 'channel' : 'user',
        identifier: args.n ? args.n : command.privmsg.sender.user,
        messages: [],
      });
    }

    if (args.c) {
      await _chatContextModel.deleteOne({ _id: chatContext._id });

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

    messages.push({ role: 'user', content: command.privmsg.text });

    const completion = await duke.openRouter.chat.send({
      model: 'openrouter/auto',
      messages,
    });

    const content = completion.choices[0].message.content;
    if (typeof content === 'string') {
      await command.privmsg.reply(content);

      chatContext.messages.push({
        input: command.privmsg.text,
        output: {
          id: completion.id,
          content: content,
          reasoningDetails: 'Response generated using openrouter/auto model.',
        },
      });
      await chatContext.save();
    } else {
      await command.privmsg.reply('Error: received non-text content response.');
    }
  }
}
