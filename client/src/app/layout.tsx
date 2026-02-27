import "./globals.css";
import SyncUser from "@/components/SyncUser";
import ConvexClientProvider from '@/components/providers/ConvexClientProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white">
        <ConvexClientProvider>
          <SyncUser />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
