import { Mongoose, ObjectId, Schema, Types } from 'mongoose';

export interface IrcUser {
  nick: string;
  mustIdentify: boolean;
  players: ObjectId[];
}

export const ircUserSchema = new Schema<IrcUser>({
  nick: String,
  mustIdentify: Boolean,
  players: [Types.ObjectId],
});

export function ircUserModel(mongoose: Mongoose) {
  return mongoose.model('IrcUser', ircUserSchema);
}
