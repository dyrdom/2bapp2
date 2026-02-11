export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface SocketEvents {
  'message:new': { conversationId: string; messageId: string };
  'message:edit': { conversationId: string; messageId: string; content: string };
  'message:delete': { conversationId: string; messageId: string };
  typing: { conversationId: string; userId: string; isTyping: boolean };
  presence: { userId: string; status: PresenceStatus };
  read_receipt: { conversationId: string; userId: string; messageId: string };
}
