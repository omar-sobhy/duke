import { Mongoose, Schema } from 'mongoose';

export interface UserPermission {
  level: number;
  serverName: string;
  mask: string;
}

export const userPermissionSchema = new Schema<UserPermission>({
  level: Number,
  serverName: String,
  mask: String,
});

export function userPermissionModel(mongoose: Mongoose) {
  return mongoose.model<UserPermission>('UserPermission', userPermissionSchema);
}
