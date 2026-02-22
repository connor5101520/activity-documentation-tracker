import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import NotificationManager from "@/components/NotificationManager";

export const metadata: Metadata = {
  title: "ActivityTracker - Log Your Daily Tasks & Accomplishments",
  description:
    "Track your daily activities, get reminders, and receive weekly email summaries of your accomplishments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen font-sans antialiased">
        <SessionProvider>
          <NotificationManager />
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
