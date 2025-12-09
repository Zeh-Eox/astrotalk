import { create } from "zustand";
import { HTTP_CLIENT } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,

  checkAuth: async () => {
    try {
      const response = await HTTP_CLIENT.get("/auth/check");
      set({authUser: response.data});
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
      set({authUser: response.data});

      toast.success("Account created successfully")
    } catch (error) {
      toast.error(error.response.data.message)
    } finally {
      set({isSigningUp: false})
    }
  },

  login: async (data) => {
    set({isLoggingIn: true})
    try {
      const response = await HTTP_CLIENT.post("/auth/login", data);
      set({authUser: response.data});

      toast.success("Logged in successfully")
    } catch (error) {
      toast.error(error.response.data.message)
    } finally {
      set({isLoggingIn: false})
    }
  },

  logout: async () => {
    try {
      await HTTP_CLIENT.post("/auth/logout");
      set({authUser: null});
      toast.success("Logged out successfully")
    } catch (error) {
      toast.error(error.response.data.message)
    }
  }
}))