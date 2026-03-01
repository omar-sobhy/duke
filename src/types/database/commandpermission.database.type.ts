export interface CommandPermission {
  id: number;
  level: number;
  command: string;
  nick?: string;
  requireNickserv: boolean;
}
