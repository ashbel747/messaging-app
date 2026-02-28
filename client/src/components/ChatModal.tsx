"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { X, Send, Trash2 } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

export default function ChatModal({ 
  user: initialUser, 
  onClose 
}: { 
  user: Doc<"users">; 
  onClose: () => void 
}) {
  const [input, setInput] = useState("");
  const [now, setNow] = useState(Date.now());
  const [selectedMessages, setSelectedMessages] = useState<Id<"messages">[]>([]);

  const currentUser = useQuery(api.users.getMe);
  const otherUser = useQuery(api.users.getUserById, { id: initialUser._id });
  const messages = useQuery(api.messages.getMessages, { otherUserId: initialUser._id });

  const sendMessage = useMutation(api.messages.send);
  const softDeleteMessages = useMutation(api.messages.softDeleteMessages);
  const setTyping = useMutation(api.users.setTyping);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSelect = (id: Id<"messages">) => {
    setSelectedMessages(prev =>
        prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
    };

  const handleDelete = async () => {
    if (selectedMessages.length === 0) return;
    await softDeleteMessages({ messageIds: selectedMessages });
    setSelectedMessages([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    setTyping({ receiverId: initialUser._id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ receiverId: initialUser._id, isTyping: false });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping({ receiverId: initialUser._id, isTyping: false });

    await sendMessage({ content: input, receiverId: initialUser._id });
    setInput("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = otherUser?.lastSeen && (now - otherUser.lastSeen < 2000);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl flex flex-col h-150 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={initialUser.image} className="w-10 h-10 rounded-full border" alt="" />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{initialUser.name}</h2>
              <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Selection Delete Bar */}
        {selectedMessages.length > 0 && (
          <div className="p-3 bg-red-50 border-b flex justify-between items-center">
            <span className="text-sm text-red-600">
              {selectedMessages.length} selected
            </span>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages === undefined ? (
            <div className="flex justify-center pt-10 text-gray-400">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <span className="text-4xl">👋</span>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isSelected = selectedMessages.includes(msg._id);

                return (
                  <div
                    key={msg._id}
                    className={`flex group ${msg.isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className="relative flex items-start gap-2">

                      {/* Checkbox (only your messages & not deleted) */}
                      {msg.isMine && !msg.isDeleted && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(msg._id)}
                          className="mt-2 opacity-0 group-hover:opacity-100 transition"
                        />
                      )}

                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.isMine
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white border rounded-tl-none"
                        } ${
                          isSelected ? "ring-2 ring-red-400" : ""
                        }`}
                      >
                        {msg.isDeleted ? (
                          <p className="text-sm italic opacity-70">
                            This message was deleted
                          </p>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}

                        <p
                          className={`text-[10px] mt-1 text-right ${
                            msg.isMine ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {formatTimestamp(msg._creationTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {otherUser?.isTypingId === currentUser?._id && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 px-4 py-2 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <span className="text-[13px] text-gray-500">
                      {currentUser?.name} is typing
                    </span>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}