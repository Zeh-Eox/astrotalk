import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore.js";
import UserLoadingSkeleton from "./UserLoadingSkeleton.js";
import NoChatsFound from "./NoChatsFound.js";
import { useAuthStore } from "../store/useAuthStore.js";
import type { ChatUser } from "../types/message.js";

const ChatsList: React.FC = () => {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } =
    useChatStore();

  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UserLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat: ChatUser) => (
        <div
          key={chat._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(chat)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`avatar ${
                onlineUsers.includes(chat._id) ? "online" : "offline"
              }`}
            >
              <div className="size-12 rounded-full">
                <img
                  src={chat.profilePicture ?? "/avatar.png"}
                  alt={chat.fullName}
                />
              </div>
            </div>

            <h4 className="text-slate-200 font-medium truncate">
              {chat.fullName}
            </h4>
          </div>
        </div>
      ))}
    </>
  );
};

export default ChatsList;
