import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: {
    default: "SubKeep - Subscription Manager",
    template: "%s | SubKeep",
  },
  description: "Track, manage, and optimize all your subscriptions in one place. Get reminders, smart insights, and take control of your spending.",
  keywords: ["subscription manager", "subscription tracker", "spending tracker", "recurring payments"],
  openGraph: {
    title: "SubKeep - Subscription Manager",
    description: "Never miss a subscription payment again. Track, manage, and optimize all your subscriptions.",
    siteName: "SubKeep",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SubKeep - Subscription Manager",
    description: "Never miss a subscription payment again.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}