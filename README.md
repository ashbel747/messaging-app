# Flashchat Messanger App

<p align="center">
  <img
    src="https://flash-chat-blush.vercel.app/chat-icon.jpg"
    alt="Flashchat Logo"
    width="120"
  />
</p>

> A high-performance, real-time messaging platform built for the Tars Full Stack Internship Challenge 2026.

Flash Chat is a modern communication tool that leverages a fully reactive backend to provide instantaneous messaging, presence tracking, and unread notifications without the overhead of traditional WebSocket management.

**🛠️ Tech Stack**


**✨ Key Features**
Real-time Messaging: Messages appear instantly across all devices using Convex subscriptions.

Live Presence: Real-time green indicators for "Active Now" status with a smart 5-second heartbeat system.

Unread Indicators: Dynamic badges that update in real-time as new messages arrive.

Responsive Layout: Desktop sidebar + chat view and a mobile-first "back-button" navigation.

Smart Auto-Scroll: Automatically scrolls to the latest message with a manual override toggle.

User Discovery: Search for any registered user by username to start a new conversation instantly.

**📂 Project Structure**
```bash
client/
├── convex/                # Backend functions (Mutations, Queries, Schema)
│   ├── auth.config.ts     # Clerk + Convex integration
│   ├── schema.ts          # Database tables definitions
│   └── users.ts           # Presence & user logic
│   └── messages.ts        # Chat messages logic
├── src/
│   ├── app/               # Next.js App Router (Layouts & Pages)
│   ├── components/        # UI Components (ChatModal, Context Providers, etc.)
│   ├── hooks/             # Custom React Hooks (for usePresence)
│   └── lib/               # Utils for message timestamps
```
**💻 Local Setup Instructions**
Follow these steps to get Flash Chat running on your local machine.

1. Clone the repository
```bash
git clone https://github.com/ashbel747/messaging-app
cd client
```
2. Install Dependencies
```bash
npm install
```
3. Configure Environment Variables
a) Create a .env.local file in the convex folder in the client directory and paste the following configuration:

```bash
# Convex Backend Configuration
CONVEX_DEPLOYMENT=dev:gallant-goose-668
NEXT_PUBLIC_CONVEX_URL=https://gallant-goose-668.eu-west-1.convex.cloud
CONVEX_URL=https://gallant-goose-668.eu-west-1.convex.cloud
CONVEX_SITE_URL=https://gallant-goose-668.eu-west-1.convex.site
NEXT_PUBLIC_CONVEX_SITE_URL=https://gallant-goose-668.eu-west-1.convex.site
```
b) Create a .env.local file in the root level of the client directory and paste the following configuration:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhcm1pbmctbWFtbW90aC0zMi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_5K9IVBjm53poBYUFGIsWCdEpWzkUIBKyxSWMJ6KD5Y
CLERK_JWT_ISSUER_DOMAIN=https://charming-mammoth-32.clerk.accounts.dev
```
4. Run the Development Environment
You will need to run two processes simultaneously. It is recommended to use two different terminal tabs:

Terminal 1: Start the Convex Backend

```bash
cd client
npx convex dev
```
Terminal 2: Start the Next.js Frontend

```bash
cd client
npm run dev
```
The local app should now be running at http://localhost:3000.

**🏗️ Implementation Details**
Real-time Presence System
The "Online" status is managed via a Heartbeat Pattern.

The usePresence hook triggers a lastSeen update in Convex every 5 seconds.

The UsersPage calculates online status by checking if the user's lastSeen timestamp is within a 5-second window of the current time.

Event listeners for visibilitychange and focus ensure the status updates immediately when a user returns to the tab.

Reactive Data Flow
Instead of traditional REST API "pulls," this app uses Convex Subscriptions. When a message is sent via a mutation, the useQuery hooks on the recipient's side automatically re-run, updating the UI instantly without manual state management or page refreshes.
