export interface ChatMessage {
  id: number;
  contextIdentifier: string;
  input: string;
  text: string;
  splitIndex: number;
}
