import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <SignedOut>
        <div className="p-8 border-2 border-dashed border-blue-500 rounded-xl text-center">
          <p className="mb-4 font-bold">You are currently Signed Out</p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
              Click here to Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="p-8 border-2 border-green-500 rounded-xl text-center">
          <p className="mb-4">You are Signed In!</p>
          <UserButton showName />
        </div>
      </SignedIn>
      
      <h1 className="text-3xl font-extrabold">Messaging App</h1>
    </main>
  );
}