"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { X, Send, Trash2, ArrowLeft, ArrowDown, Smile, Loader2 } from "lucide-react"; // Added ArrowLeft
import { formatTimestamp } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";

const FIXED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const currentUser = useQuery(api.users.getMe);
  const otherUser = useQuery(api.users.getUserById, { id: initialUser._id });
  const messages = useQuery(api.messages.getMessages, { otherUserId: initialUser._id });

  const sendMessage = useMutation(api.messages.send);
  const softDeleteMessages = useMutation(api.messages.softDeleteMessages);
  const setTyping = useMutation(api.users.setTyping);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
  };
  
  const toggleSelect = (id: Id<"messages">) => {
    setSelectedMessages(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
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

    const messageToRestore = input;

    try {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTyping({ receiverId: initialUser._id, isTyping: false });
      setInput(""); 

      await sendMessage({ content: messageToRestore, receiverId: initialUser._id });
    } catch (error) {
      console.error("Failed to send message:", error);
      setInput(messageToRestore);
      alert("Failed to send message. Please check your connection.");
    }
  };

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Detect scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop <= clientHeight + 100;
    setIsAtBottom(atBottom);
    if (atBottom) setShowScrollButton(false);
  };

  // Handle new messages
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    } else {
      setShowScrollButton(true);
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = otherUser?.lastSeen && (now - otherUser.lastSeen < 2000);

  return (
    <div className="flex flex-col h-full w-full bg-white animate-in slide-in-from-right-2 duration-200">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Back button for mobile */}
            <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full md:hidden">
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="relative">
              <img src={initialUser.image} className="w-10 h-10 rounded-full border shrink-0" alt="" />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-base md:text-lg leading-tight truncate max-w-37.5 md:max-w-none">
                {initialUser.name}
              </h2>
              <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
            </div>
          </div>
          
          {/* Desktop Close Button */}
          <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Delete Bar */}
        {selectedMessages.length > 0 && (
          <div className="p-3 bg-red-50 border-b flex justify-between items-center animate-in fade-in">
            <span className="text-sm font-medium text-red-600">
              {selectedMessages.length} selected
            </span>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Messages */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth"
        >
          {messages === undefined ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading conversation</p>
          </div>
        ) : 
        /* 2. ERROR STATE */
        messages === null ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-2">
            <div className="bg-red-50 p-3 rounded-full">
              <X className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Failed to load messages</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Try refreshing the page
            </button>
          </div>
        ) : 
        /* 3. EMPTY STATE */
        messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <span className="text-4xl">👋</span>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelected = selectedMessages.includes(msg._id);
            // Grouping into one div so the "key" works correctly
            return (
              <div key={msg._id} className="flex flex-col space-y-1"> 
                <div className={`flex group ${msg.isMine ? "justify-end" : "justify-start"}`}>
                  <div className="relative flex items-center gap-2">
                    {msg.isMine && !msg.isDeleted && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(msg._id)}
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition accent-blue-600 cursor-pointer"
                      />
                    )}

                    <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl relative ${
                        msg.isMine ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border rounded-tl-none"
                      } ${isSelected ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
                    >
                      {msg.isDeleted ? (
                        <p className="text-sm italic opacity-70">Message deleted</p>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}

                      <p className={`text-[10px] mt-1 text-right ${msg.isMine ? "text-blue-100" : "text-gray-400"}`}>
                        {formatTimestamp(msg._creationTime)}
                      </p>

                      {/* Hover Reactions */}
                      {!msg.isDeleted && (
                        <div className={`absolute -top-10 ${msg.isMine ? "right-0" : "left-0"} hidden group-hover:flex bg-white border shadow-xl rounded-full p-1 gap-1 z-20 animate-in fade-in zoom-in`}>
                          {FIXED_EMOJIS.map((emoji) => (
                            <button key={emoji} onClick={() => toggleReaction({ messageId: msg._id, emoji })} className="hover:scale-125 transition px-1 text-lg">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reaction Counts Display - Moved inside the keyed parent div */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 ${msg.isMine ? "justify-end" : "justify-start"}`}>
                    {Object.entries(
                      msg.reactions.reduce((acc: Record<string, number>, r: any) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => {
                      const hasReacted = msg.reactions?.some((r: any) => r.userId === currentUser?._id && r.emoji === emoji);
                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                          className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition ${
                            hasReacted ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-600"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
        
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
      </div>


      {showScrollButton && (
        <button onClick={() => scrollToBottom("smooth")} className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white shadow-xl border px-4 py-2 rounded-full text-sm font-semibold text-blue-600 flex items-center gap-2 z-20 hover:bg-gray-50">
          <ArrowDown className="w-4 h-4" /> New messages
        </button>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white flex items-center gap-2 relative">
        <div className="relative" ref={emojiPickerRef}>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-blue-600 transition">
            <Smile className="w-6 h-6" />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} />
            </div>
          )}
        </div>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
        <button type="submit" disabled={!input.trim()} className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}