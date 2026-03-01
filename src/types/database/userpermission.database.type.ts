export interface UserPermission {
  id: number;
  userId: number;
  level: number;
  serverName: string;
  mask: string;
}
