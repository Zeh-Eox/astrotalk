import { create } from "zustand";
import { HTTP_CLIENT } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,

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

      toast.success("Account Created Successfully")
    } catch (error) {
      toast.error(error.response.data.message)
    } finally {
      set({isSigningUp: false})
    }
  },
}))