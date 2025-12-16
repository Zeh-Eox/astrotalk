import { create } from "zustand";
import { toast } from "react-hot-toast";
import { HTTP_CLIENT } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";
import type { ChatStore, ChatUser, Message, SendMessagePayload } from "../types/message.js";

export const useChatStore = create<ChatStore>((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,

  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled") || "false"),

  toggleSound: () => {
    const newValue = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", JSON.stringify(newValue));
    set({ isSoundEnabled: newValue });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await HTTP_CLIENT.get<{ data: ChatUser[] }>("/messages/contacts");
      set({ allContacts: res.data.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await HTTP_CLIENT.get<{ data: ChatUser[] }>("/messages/chats");
      set({ chats: res.data.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await HTTP_CLIENT.get<{ data: Message[] }>(`/messages/${userId}`);
      set({ messages: res.data.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (payload) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedUser || !authUser) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage: Message = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      isOptimistic: true,
      ...(payload.text && { text: payload.text }),
      ...(payload.image && { image: payload.image }),
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await HTTP_CLIENT.post<{ data: Message }>(
        `/messages/send/${selectedUser._id}`,
        payload
      );

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? res.data.data : msg
        ),
      }));
    } catch (error: any) {
      set({ messages });
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage: Message) => {
      if (newMessage.senderId !== selectedUser._id) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      if (isSoundEnabled) {
        const audio = new Audio("/sounds/notification.mp3");
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
}));
