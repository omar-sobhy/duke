import { Mongoose, Schema } from 'mongoose';

export interface ChatContext {
  type: 'user' | 'channel';
  identifier: string;
  messages: {
    input: string;
    output: {
      id: string;
      content: string;
      reasoningDetails: string;
    };
  }[];
}

export const chatContextSchema = new Schema<ChatContext>({
  identifier: String,
  messages: [
    {
      input: String,
      output: {
        id: String,
        content: String,
        reasoningDetails: String,
      },
    },
  ],
});

export function chatContextModel(mongoose: Mongoose) {
  return mongoose.model<ChatContext>('ChatContext', chatContextSchema);
}
