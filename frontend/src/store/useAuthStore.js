import { create } from "zustand";
import { HTTP_CLIENT } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client"

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/"

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const response = await HTTP_CLIENT.get("/auth/check");
      set({authUser: response.data.data});

      get().connectSocket();
    } catch (error) {
      console.error("Error in authCheck: ", error);
      set({authUser: null});
    } finally {
      set({isCheckingAuth: false})
    }
  },

  signup: async (data) => {
    set({isSigningUp: true})
    try {
      const response = await HTTP_CLIENT.post("/auth/signup", data);
      set({authUser: response.data.data});

      toast.success("Account created successfully")

      get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message)
    } finally {
      set({isSigningUp: false})
    }
  },

  login: async (data) => {
    set({isLoggingIn: true})
    try {
      const response = await HTTP_CLIENT.post("/auth/login", data);
      set({authUser: response.data.data});

      toast.success("Logged in successfully")

      get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message)
    } finally {
      set({isLoggingIn: false})
    }
  },

  logout: async () => {
    try {
      await HTTP_CLIENT.post("/auth/logout");
      set({authUser: null});
      toast.success("Logged out successfully")

      get().disconnectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message)
    }
  },

  updateProfile: async (data) => {
    const toastId = toast.loading("Updating profile...");
    try {
      const res = await HTTP_CLIENT.put("/auth/update-profile", data);
      set({ authUser: res.data.data });
      toast.success("Profile updated successfully", {id: toastId});
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error?.response?.data?.message);
    }
  },

  connectSocket: () => {
    const {authUser} = get();
    if(!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      withCredentials: true
    })

    socket.connect();

    set({socket})

    // Online users event
    socket.on("getOnlineUsers", (userIds) => {
      set({onlineUsers: userIds})
    })
  },

  disconnectSocket: () => {
    if(get().socket?.connected) get().socket.disconnect();
  }
}))