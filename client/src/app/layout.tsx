import "./globals.css";
import SyncUser from "@/components/SyncUser";
import ConvexClientProvider from '@/components/providers/ConvexClientProvider';
import PresenceProvider from "@/components/PresenceProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <ConvexClientProvider>
          <PresenceProvider />
          <SyncUser />
          <div className="min-h-screen">
            {children}
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
