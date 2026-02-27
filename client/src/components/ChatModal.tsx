"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { X, Send } from "lucide-react";
import { formatTimestamp } from "@/lib/utils"; // Use the helper from the previous step

export default function ChatModal({ 
  user, 
  onClose 
}: { 
  user: Doc<"users">; 
  onClose: () => void 
}) {
  const [input, setInput] = useState("");
  
  // 1. Fetch messages for this specific conversation
  // Note: You'll need to create the getMessages query in convex/messages.ts
  const messages = useQuery(api.messages.getMessages, { otherUserId: user._id });
  const sendMessage = useMutation(api.messages.send);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendMessage({ content: input, receiverId: user._id });
    setInput("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl flex flex-col h-[600px] shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={user.image} className="w-10 h-10 rounded-full" alt="" />
            <h2 className="font-bold text-lg">{user.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages === undefined ? (
            <div className="flex justify-center pt-10 text-gray-400">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <span className="text-4xl">👋</span>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.isMine ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border rounded-tl-none"
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.isMine ? "text-blue-100" : "text-gray-400"}`}>
                    {formatTimestamp(msg._creationTime)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button type="submit" disabled={!input.trim()} className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}