import { Mongoose, Schema } from 'mongoose';

export interface ChatContext {
  type: 'user' | 'channel';
  identifier: string;
  messages: {
    nextIndex: number;
    input: string;
    output: string[];
  }[];
}

export const chatContextSchema = new Schema<ChatContext>({
  identifier: String,
  type: String,
  messages: [
    {
      nextIndex: Number,
      input: String,
      output: [String],
    },
  ],
});

export function chatContextModel(mongoose: Mongoose) {
  return mongoose.model<ChatContext>('ChatContext', chatContextSchema);
}
