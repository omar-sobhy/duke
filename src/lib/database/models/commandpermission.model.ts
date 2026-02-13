import { Mongoose, Schema } from 'mongoose';

export interface CommandPermission {
  level : number;
  command: string;
  nick?: string;
  requireNickserv: boolean;
}

export const commandPermissionSchema = new Schema<CommandPermission>({
  level: Number,
  nick: String,
  command: String,
  requireNickserv: Boolean,
});

export function commandPermissionModel(mongoose: Mongoose) {
  return mongoose.model<CommandPermission>('CommandPermission', commandPermissionSchema);
}
