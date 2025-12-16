export interface ChatUser {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  createdAt: string;
  isOptimistic?: boolean;
}

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

  getAllContacts: () => Promise<void>;
  getMyChatPartners: () => Promise<void>;
  getMessagesByUserId: (userId: string) => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;

  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}
