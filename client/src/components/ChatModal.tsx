"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { X, Send, Trash2, ArrowLeft, ArrowDown, Smile, Loader2, CheckCircle2 } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";

const FIXED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export default function ChatModal({ user: initialUser, onClose }: { user: Doc<"users">; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [now, setNow] = useState(Date.now());
  const [selectedMessages, setSelectedMessages] = useState<Id<"messages">[]>([]);
  const [focusedMessageId, setFocusedMessageId] = useState<Id<"messages"> | null>(null);
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
      if (!(event.target as HTMLElement).closest('.message-container')) {
        setFocusedMessageId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: any) => setInput((prev) => prev + emojiData.emoji);
  
  const toggleSelect = (id: Id<"messages">) => {
    setSelectedMessages(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setTyping({ receiverId: initialUser._id, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ receiverId: initialUser._id, isTyping: false });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const content = input;
    setInput(""); 
    await sendMessage({ content, receiverId: initialUser._id });
  };

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
  };

  useEffect(() => { if (isAtBottom) scrollToBottom(); }, [messages]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = otherUser?.lastSeen && (now - otherUser.lastSeen < 2000);

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Header */}
      <div className="p-4 px-6 border-b flex justify-between items-center bg-white z-20">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <img src={initialUser.image} className="w-10 h-10 rounded-2xl object-cover border shadow-sm" alt="" />
            {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
          </div>
          <div>
            <h2 className="font-bold text-[15px] text-gray-800 leading-tight">{initialUser.name}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>
        <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-50 rounded-xl transition text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef} 
        onScroll={() => {
          if (!scrollRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
          setIsAtBottom(scrollHeight - scrollTop <= clientHeight + 100);
        }}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#F8F9FB]"
      >
        {messages === undefined ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin opacity-50" />
            <p className="text-[10px] font-black text-gray-400 tracking-widest">Loading Chats</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 grayscale">
            <div className="bg-gray-200 p-4 rounded-3xl mb-4">
              <Smile size={32} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">No messages here yet</p>
            <p className="text-xs text-gray-500">Say hello to {initialUser?.name}!</p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isMine = msg.isMine;
            const isFocused = focusedMessageId === msg._id;
            const isSelected = selectedMessages.includes(msg._id);
            const isSelectionMode = selectedMessages.length > 0;

            const handleBubbleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              
              // 1. If we are already selecting things, clicking the bubble toggles selection
              if (isSelectionMode) {
                toggleSelect(msg._id);
              } else {
                // 2. Otherwise, clicking the bubble shows the reaction tools (focus)
                setFocusedMessageId(isFocused ? null : msg._id);
              }
            };

            return (
              <div key={msg._id} className={`flex flex-col message-container w-full ${isMine ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-3 max-w-[85%] md:max-w-[70%]">
                  
                  {/* Checkbox: Always show if selected, OR show if focused */}
                  {(isFocused || isSelected) && isMine && !msg.isDeleted && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSelect(msg._id); }}
                      className={`shrink-0 transition-all duration-200 ${
                        isSelected 
                          ? "text-gray-600 scale-110 opacity-100" 
                          : "text-gray-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <CheckCircle2 
                        size={22} 
                        fill={isSelected ? "currentColor" : "#E5E7EB"} 
                        className={isSelected ? "text-gray-600" : "text-gray-400"}
                        stroke={isSelected ? "white" : "currentColor"}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                    </button>
                  )}

                  <div 
                    onClick={handleBubbleClick}
                    className={`cursor-pointer p-4 rounded-3xl relative transition-all duration-200 shadow-sm ${
                      isMine 
                        ? "bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-tr-none" 
                        : "bg-white text-gray-800 rounded-tl-none"
                    } ${isSelected ? "ring-2 ring-blue-500 ring-offset-2 scale-[0.98] opacity-90" : "hover:scale-[1.01]"}`}
                  >
                    {msg.isDeleted ? (
                      <p className="text-sm italic opacity-60">Message deleted</p>
                    ) : (
                      <p className="text-[14px] leading-relaxed font-medium">{msg.content}</p>
                    )}
                    <p className="text-[9px] mt-1.5 font-bold tracking-tighter opacity-80 text-right">
                      {formatTimestamp(msg._creationTime)}
                    </p>
                  </div>
                </div>

                {/* Quick Reactions: Appear on Click */}
                {isFocused && !msg.isDeleted && (
                  <div className="flex gap-1 mt-2 animate-in fade-in zoom-in duration-200">
                    {FIXED_EMOJIS.map((emoji) => (
                      <button 
                        key={emoji} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleReaction({ messageId: msg._id, emoji }); 
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-sm hover:scale-125 transition-transform text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reaction Display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    {Object.entries(msg.reactions.reduce((acc: any, r: any) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {})).map(([emoji, count]: any) => {
                      const hasReacted = msg.reactions?.some((r: any) => r.userId === currentUser?._id && r.emoji === emoji);
                      return (
                        <button 
                          key={emoji} 
                          onClick={(e) => { 
                            e.stopPropagation();
                            toggleReaction({ messageId: msg._id, emoji }); 
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex gap-1 items-center shadow-sm border transition ${
                            hasReacted ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-100 text-gray-500"
                          }`}
                        >
                          <span>{emoji}</span> <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Aligned Typing Indicator */}
        {otherUser?.isTypingId === currentUser?._id && (
          <div className="flex items-center bg-gray-100 w-fit px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm animate-in fade-in slide-in-from-left-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-blue-500 tracking-wider">
                {currentUser?.name} is typing
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <form onSubmit={handleSend} className="p-4 px-6 border-t bg-white flex items-center gap-3 relative z-30">
        <div className="relative" ref={emojiPickerRef}>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-400 hover:text-blue-600 transition">
            <Smile size={24} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-4 shadow-2xl rounded-3xl overflow-hidden z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} />
            </div>
          )}
        </div>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Write a message..."
          className="flex-1 px-5 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium"
        />
        <button type="submit" disabled={!input.trim()} className="bg-linear-to-r from-blue-500 to-blue-600 text-white p-3 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-30">
          <Send size={20} />
        </button>
      </form>

      {/* Bulk Delete Bar */}
      {selectedMessages.length > 0 && (
        <div className="absolute top-18 left-0 right-0 p-3 px-6 bg-gray-400 flex justify-between items-center z-40 animate-in slide-in-from-top-full">
          <span className="text-white text-xs font-black uppercase tracking-widest">{selectedMessages.length} Selected</span>
          <div className="flex gap-3">
             <button onClick={() => setSelectedMessages([])} className="text-white/80 text-xs font-bold hover:text-white">Cancel</button>
             <button onClick={async () => { await softDeleteMessages({ messageIds: selectedMessages }); setSelectedMessages([]); }} className="bg-white text-red-600 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-2">
               <Trash2 size={14} /> Delete
             </button>
          </div>
        </div>
      )}
    </div>
  );
}