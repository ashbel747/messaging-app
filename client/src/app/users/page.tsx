"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Loader2, Search, Send, Users } from "lucide-react";
import ChatModal from "@/components/ChatModal";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeChatUser, setActiveChatUser] = useState<Doc<"users"> | null>(null);
  const [now, setNow] = useState(Date.now());

  const markRead = useMutation(api.messages.markRead);
  const users = useQuery(api.users.getUsers, { searchTerm });
  const unreadCounts = useQuery(api.messages.getUnreadCounts) || {};

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectUser = (user: Doc<"users">) => {
    setActiveChatUser(user);
    markRead({ otherUserId: user._id });
  };

  const isError = users === null;

  return (
    <main className="flex h-screen bg-gray-100 overflow-hidden p-2 lg:p-4 gap-4">
      <section className={`${activeChatUser ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-100 bg-white rounded-3xl shadow-xl overflow-hidden`}>
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div className="shrink-0">
              <Link href="/">
                <Image
                  src="/chat-icon.jpg" 
                  alt="Logo" 
                  width={32} 
                  height={32} 
                  className="rounded-lg object-cover shadow-sm"
                />
              </Link>
            </div>
            
            <h1 className="text-xl font-black text-gray-800 tracking-tight uppercase">Users</h1>
            
            <div className="shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          
          {/* Modern Search Input */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
            <input
              type="text"
              placeholder="Search for a user by username..."
              className="w-full pl-11 pr-4 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* User List*/}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {users === undefined ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Syncing...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="text-sm text-red-500 font-medium">Failed to load users</p>
              <button onClick={() => window.location.reload()} className="text-xs text-blue-600 underline">Try again</button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-sm text-gray-400 italic">No users found</div>
          ) : (
            users.map((user) => {
              const isOnline = user.lastSeen && now - user.lastSeen < 2000;
              const isActive = activeChatUser?._id === user._id;
              const unreadCount = unreadCounts[user._id] || 0;

              return (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 cursor-pointer border-none ${
                    isActive 
                      ? "bg-gray-100 shadow-sm scale-[1.02]" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img src={user.image} alt={user.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-white" />
                    {isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-[3px] border-white rounded-full" />
                    )}
                  </div>

                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`font-bold text-[15px] truncate ${isActive ? "text-gray-900" : "text-gray-800"}`}>
                        {user.name}
                      </h3>
                      {unreadCount > 0 && !isActive && (
                        <span className="bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-5 text-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-medium ${isOnline ? "text-green-600" : "text-gray-400"}`}>
                      {isOnline ? "Active now" : "Offline"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Main Chat Area */}
      <section className={`${!activeChatUser ? "hidden md:flex" : "flex"} flex-1 flex-col bg-white rounded-3xl shadow-xl overflow-hidden relative`}>
        {activeChatUser ? (
          <ChatModal user={activeChatUser} onClose={() => setActiveChatUser(null)} />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-300">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <Send className="w-10 h-10 opacity-20 -rotate-12" />
            </div>
            <p className="text-sm">Select a contact to start a conversation</p>
          </div>
        )}
      </section>
    </main>
  );
}