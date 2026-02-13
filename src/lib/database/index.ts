import mongoose from 'mongoose';
import { playerModel } from './models/player.model.js';
import { chatContextModel } from './models/chatcontext.model.js';
import { commandPermissionModel } from './models/commandpermission.model.js';
import { userPermissionModel } from './models/userpermission.model.js';

export const models = [
  playerModel(mongoose),
  chatContextModel(mongoose),
  commandPermissionModel(mongoose),
  userPermissionModel(mongoose),
];

export async function database(url: string) {
  return await mongoose.connect(url);
}
