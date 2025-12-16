import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import {toast} from "react-hot-toast";

import { HTTP_CLIENT } from "../lib/axios.js";
import type { AuthStore } from "../types/auth.js";
import type { User } from "../types/index.js";
import type { ApiResponse } from "../types/index.js";
import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "/";

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],
  isUpdatingProfile: false,

  checkAuth: async () => {
    try {
      const res = await HTTP_CLIENT.get<ApiResponse<User>>("/auth/check");
      set({ authUser: res.data.data });
      get().connectSocket();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      } else {
        toast.error("Unexpected error");
      }
    }
    finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await HTTP_CLIENT.post<ApiResponse<User>>(
        "/auth/signup",
        data
      );
      set({ authUser: res.data.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      } else {
        toast.error("Unexpected error");
      }
    }
    finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await HTTP_CLIENT.post<ApiResponse<User>>(
        "/auth/login",
        data
      );
      set({ authUser: res.data.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      } else {
        toast.error("Unexpected error");
      }
    }
    finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await HTTP_CLIENT.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      } else {
        toast.error("Unexpected error");
      }
    }
  },

  updateProfile: async (data) => {
    const toastId = toast.loading("Updating profile...");
    try {
      const res = await HTTP_CLIENT.put<ApiResponse<User>>(
        "/auth/update-profile",
        data
      );
      set({ authUser: res.data.data });
      toast.success("Profile updated successfully", { id: toastId });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      } else {
        toast.error("Unexpected error");
      }
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    const newSocket: Socket = io(BASE_URL, {
      withCredentials: true,
    });

    newSocket.connect();

    newSocket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
