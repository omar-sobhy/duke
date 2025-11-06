import { Mongoose, Schema } from 'mongoose';

export interface ChatContext {
  type: 'user' | 'channel';
  identifier: string;
  messages: {
    input: string;
    output: {
      content: string;
      finished: boolean;
    };
  }[];
}

export const chatContextSchema = new Schema<ChatContext>({
  identifier: String,
  type: String,
  messages: [
    {
      input: String,
      output: {
        content: String,
        finished: Boolean,
      },
    },
  ],
});

export function chatContextModel(mongoose: Mongoose) {
  return mongoose.model<ChatContext>('ChatContext', chatContextSchema);
}
