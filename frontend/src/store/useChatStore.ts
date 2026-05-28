import { create } from "zustand";
import { toast } from "react-hot-toast";
import { HTTP_CLIENT } from "../lib/axios.js";
import { getErrorMessage } from "../lib/errors.js";
import { useAuthStore } from "./useAuthStore.js";
import type {
  ChatStore,
  ChatUser,
  Message,
  SendMessagePayload,
} from "../types/message.js";

const SOUND_KEY = "isSoundEnabled";

let newMessageHandler: ((msg: Message) => void) | null = null;

const playNotification = () => {
  const audio = new Audio("/sounds/notification.mp3");
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

const showBrowserNotification = (title: string, body: string) => {
  if (typeof Notification === "undefined") return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/messages-logo.webp" });
  } else if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
};

export const useChatStore = create<ChatStore>((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,

  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem(SOUND_KEY) || "false"),

  toggleSound: () => {
    const newValue = !get().isSoundEnabled;
    localStorage.setItem(SOUND_KEY, JSON.stringify(newValue));
    set({ isSoundEnabled: newValue });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  getAllContacts: async (search) => {
    set({ isUsersLoading: true });
    try {
      const res = await HTTP_CLIENT.get<{ data: ChatUser[] }>(
        "/messages/contacts",
        { params: search ? { search } : undefined }
      );
      set({ allContacts: res.data.data });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await HTTP_CLIENT.get<{ data: ChatUser[] }>(
        "/messages/chats"
      );
      set({ chats: res.data.data });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await HTTP_CLIENT.get<{ data: Message[] }>(
        `/messages/${userId}`
      );
      set({ messages: res.data.data });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (payload: SendMessagePayload) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    if (!selectedUser || !authUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      createdAt: new Date().toISOString(),
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
        messages: state.messages.map((m) =>
          m._id === tempId ? res.data.data : m
        ),
      }));
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId),
      }));
      toast.error(getErrorMessage(error, "Failed to send message"));
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    if (newMessageHandler) socket.off("newMessage", newMessageHandler);

    newMessageHandler = (newMessage: Message) => {
      const { selectedUser, isSoundEnabled, chats } = get();
      const isFromSelected = selectedUser?._id === newMessage.senderId;

      if (isFromSelected) {
        set((state) => ({ messages: [...state.messages, newMessage] }));
      }

      const partner = chats.find((c) => c._id === newMessage.senderId);
      if (!partner) {
        get().getMyChatPartners();
      }

      if (isSoundEnabled) playNotification();

      showBrowserNotification(
        partner?.fullName ?? "New message",
        newMessage.text ?? "Sent you an image"
      );
    };

    socket.on("newMessage", newMessageHandler);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && newMessageHandler) {
      socket.off("newMessage", newMessageHandler);
    }
    newMessageHandler = null;
  },
}));
