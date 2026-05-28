import type { Message, User } from "./index.js";

export type ChatUser = User;
export type { Message };

export interface SendMessagePayload {
  text?: string;
  image?: string;
}

export interface ChatStore {
  allContacts: ChatUser[];
  chats: ChatUser[];
  messages: Message[];
  activeTab: "chats" | "contacts";
  selectedUser: ChatUser | null;

  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  isSoundEnabled: boolean;

  toggleSound: () => void;
  setActiveTab: (tab: "chats" | "contacts") => void;
  setSelectedUser: (user: ChatUser | null) => void;

  getAllContacts: (search?: string) => Promise<void>;
  getMyChatPartners: () => Promise<void>;
  getMessagesByUserId: (userId: string) => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;

  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}
