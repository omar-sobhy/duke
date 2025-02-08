import { Mongoose, Schema } from 'mongoose';

export interface Player {
  name: string;
  skills: {
    skillName: string;
    level: string;
    xp: string;
  }[];
}

export const playerSchema = new Schema<Player>({
  name: String,
  skills: [
    {
      skillName: String,
      level: String,
      xp: String,
    },
  ],
});

export function playerModel(mongoose: Mongoose) {
  return mongoose.model<Player>('Player', playerSchema);
}
