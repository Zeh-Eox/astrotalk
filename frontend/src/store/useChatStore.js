import toast from "react-hot-toast";
import { create } from "zustand";
import { HTTP_CLIENT } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await HTTP_CLIENT.get("/messages/contacts");
      set({ allContacts: res.data.data });
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await HTTP_CLIENT.get("/messages/chats");
      set({ chats: res.data.data });
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessageByUserId: async (userId) => {
    set({isMessagesLoading: true})

    try {
      const res = await HTTP_CLIENT.get(`/messages/${userId}`)
      set({messages: res.data.data})
    } catch (error) {
      toast.error(error?.response?.data?.message)
    } finally {
      set({isMessagesLoading: false})
    }
  },

  sendMessage: async (messageData) => {
    const {selectedUser, messages} = get();
    const {authUser} = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      isOptimistic: true, // Flag
    }

    set({messages: [...messages, optimisticMessage]})

    try {
      const res = await HTTP_CLIENT.post(`/messages/send/${selectedUser._id}`, messageData)
      set({messages: messages.concat(res.data.data)})
    } catch (error) {
      set({messages: messages})
      toast.error(error?.response?.data?.data || "Something went wrong")
    }
  }

}))