import React, { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore.js";
import { toast } from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, Loader2 } from "lucide-react";
import useKeyboardSound from "../hooks/useKeyBoardSound.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MessageInput: React.FC = () => {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSending) return;

    setIsSending(true);

    try {
      if (isSoundEnabled) playRandomKeyStrokeSound();

      const payload: { text?: string; image?: string } = {};
      const trimmedText = text.trim();

      if (trimmedText) payload.text = trimmedText;
      if (imagePreview) payload.image = imagePreview;

      await sendMessage(payload);

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      textInputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadstart = () => {
      // Optional: show loading state
    };

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read image file. Please try again.");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && imagePreview) {
        removeImage();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [imagePreview]);

  return (
    <div className="p-4 border-t border-slate-700/50">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Image preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700 transition-colors"
              type="button"
              aria-label="Remove image"
              disabled={isSending}
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="ml-3 text-xs text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Esc</kbd>{" "}
            to remove
          </p>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="max-w-3xl mx-auto flex space-x-4"
      >
        <input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow"
          placeholder="Type your message..."
          disabled={isSending}
          aria-label="Message input"
        />

        <input
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          disabled={isSending}
          aria-label="Upload image"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`bg-slate-800/50 hover:bg-slate-800 rounded-lg px-4 transition-colors ${
            imagePreview
              ? "text-cyan-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
          disabled={isSending}
          aria-label="Attach image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isSending}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          aria-label="Send message"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="sr-only">Sending...</span>
            </>
          ) : (
            <SendIcon className="w-5 h-5" />
          )}
        </button>
      </form>

      <p className="max-w-3xl mx-auto mt-2 text-xs text-slate-500 text-center">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
          Ctrl
        </kbd>{" "}
        +{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
          Enter
        </kbd>{" "}
        to send
      </p>
    </div>
  );
};

export default MessageInput;
