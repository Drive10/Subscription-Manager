import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "SubSense - Subscription Manager",
  description: "Track and optimize your subscriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}