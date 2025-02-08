import mongoose from 'mongoose';
import { playerModel } from './models/player.model.js';

export const models = [playerModel(mongoose)];

export async function database(url: string) {
  return await mongoose.connect(url);
}
