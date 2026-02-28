"use client";

import { SignInButton, SignedIn, SignedOut, UserButton} from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {

  return (
    <main className="min-h-screen bg-[#F8F9FB] text-gray-900 overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-125 bg-linear-to-b from-blue-50/50 to-transparent -z-10" />
      
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 transition-transform hover:scale-110 duration-200">
            <Image 
              src="/chat-icon.jpg"
              alt="Messenger Logo"
              fill
              className="object-contain rounded-full" 
              priority
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-gray-900">
            Flash Chat Messenger
          </span>
        </div>
        <div>
          <SignedIn>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/users">
              <button className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-2xl hover:bg-gray-800 transition-all active:scale-95">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-10 text-center md:text-left grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-6">
            Connect with <br /> 
            <span className="text-blue-600">anyone, anywhere.</span>
          </h1>
          
          <p className="text-gray-500 text-lg md:text-xl max-w-md mb-8 font-medium leading-relaxed">
            Connect with your friends and have conversations with this secure real-time messaging application
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center md:items-start">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/users">
                <button className="group bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 text-lg">
                  Start Chatting <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/users" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 text-lg">
                Open Conversations <ArrowRight className="w-5 h-5" />
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* App Preview Image */}
        <div className="relative">
          <div className="absolute -inset-4 bg-linear-to-r from-blue-400 to-indigo-400 rounded-4xl opacity-20 blur-3xl" />
          <div className="relative rounded-[2.5rem] shadow-2xl border border-gray-100 rotate-2 hover:rotate-0 transition-transform duration-500">
            <img 
              src="/chat-interface.png"
              alt="App Interface" 
              className="rounded-4xl w-full object-cover shadow-inner"
            />
          </div>
        </div>
      </section>

      {/* Footer / Info */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 flex flex-col items-center justify-center gap-6 text-gray-400 text-xs font-bold tracking-widest text-center">
        <p>
          © {new Date().getFullYear()} Flash Chat. All rights reserved.
        </p>
      </footer>
    </main>
  );
}