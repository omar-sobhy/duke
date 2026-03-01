export interface ChatContext {
  type: 'user' | 'channel';
  identifier: string;
}
