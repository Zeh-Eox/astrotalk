import type React from "react";
import ActiveTabSwitch from "../components/ActiveTabSwitch.js";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer.js";
import ChatContainer from "../components/ChatContainer.js";
import ChatsList from "../components/ChatsList.js";
import ContactList from "../components/ContactList.js";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder.js";
import ProfileHeader from "../components/ProfileHeader.js";
import { useChatStore } from "../store/useChatStore.js";

const ChatPage: React.FC = () => {
  const { activeTab, selectedUser } = useChatStore();

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        {/* LEFT SIDE */}
        <div className="w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col">
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
};

export default ChatPage;
