import React from "react";
import { useAuthStore } from "../store/useAuthStore";

const ChatPage = () => {
  const { logout } = useAuthStore();

  return (
    <div className="z-10">
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default ChatPage;
