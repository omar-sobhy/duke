import mongoose from 'mongoose';
import { playerModel } from './models/player.model.js';
import { chatContextModel } from './models/chatcontext.model.js';

export const models = [playerModel(mongoose), chatContextModel(mongoose)];

export async function database(url: string) {
  return await mongoose.connect(url);
}
