import React, { useRef } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { LogOutIcon, Volume2Icon, VolumeOffIcon } from "lucide-react";

const ProfileHeader: React.FC = () => {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const playClickSound = () => {
    const sound = new Audio("/sounds/mouse-click.mp3");
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      if (typeof reader.result !== "string") return;

      await updateProfile({
        profilePicture: reader.result,
      });
    };
  };

  return (
    <div className="p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <button
              className="size-14 rounded-full overflow-hidden relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {/*  */}
              <img
                src={authUser.profilePicture || "/avatar.png"}
                alt="User Image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
              {authUser.fullName}
            </h3>

            <p className="text-slate-400 text-xs">Online</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 items-center">
          {/* LOGOUT BTN */}
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={logout}
          >
            <LogOutIcon className="size-5" />
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            onClick={() => {
              playClickSound();
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
