import { ClerkProvider } from '@clerk/nextjs';
import SyncUser from "@/components/SyncUser";
import "./globals.css";
import ConvexClientProvider from '@/components/providers/ConvexClientProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en">
          <body className="bg-white">
            <SyncUser />
            {children}
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
