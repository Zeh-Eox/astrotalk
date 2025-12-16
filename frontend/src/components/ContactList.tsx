import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore.js";
import UserLoadingSkeleton from "./UserLoadingSkeleton.js";
import { useAuthStore } from "../store/useAuthStore.js";
import type { ChatUser } from "../types/message.js";

const ContactList: React.FC = () => {
  const { getAllContacts, allContacts, isUsersLoading, setSelectedUser } =
    useChatStore();

  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UserLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact: ChatUser) => (
        <div
          key={contact._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`avatar ${
                onlineUsers.includes(contact._id) ? "online" : "offline"
              }`}
            >
              <div className="size-12 rounded-full">
                <img
                  src={contact.profilePicture ?? "/avatar.png"}
                  alt={contact.fullName}
                />
              </div>
            </div>

            <h4 className="text-slate-200 font-medium truncate">
              {contact.fullName}
            </h4>
          </div>
        </div>
      ))}
    </>
  );
};

export default ContactList;
