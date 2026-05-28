import React, { memo, useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore.js";
import UserLoadingSkeleton from "./UserLoadingSkeleton.js";
import { useAuthStore } from "../store/useAuthStore.js";
import type { ChatUser } from "../types/message.js";

const ContactList: React.FC = () => {
  const { getAllContacts, allContacts, isUsersLoading, setSelectedUser } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(
      () => getAllContacts(search.trim() || undefined),
      250
    );
    return () => clearTimeout(id);
  }, [search, getAllContacts]);

  return (
    <>
      <div className="relative mb-2">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      {isUsersLoading ? (
        <UserLoadingSkeleton />
      ) : allContacts.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-4">
          No contacts found
        </p>
      ) : (
        allContacts.map((contact: ChatUser) => (
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
                    src={contact.profilePicture || "/avatar.png"}
                    alt={contact.fullName}
                    loading="lazy"
                  />
                </div>
              </div>

              <h4 className="text-slate-200 font-medium truncate">
                {contact.fullName}
              </h4>
            </div>
          </div>
        ))
      )}
    </>
  );
};

export default memo(ContactList);
