import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import SupabaseSync from "./components/SupabaseSync";
import ResetBanner from "./components/ResetBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NYC FRC Scout 2026",
  description: "REBUILT match scouting app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} bg-blue-50 antialiased`}>
        <Nav />
        <SupabaseSync />
        <ResetBanner />
        {children}
      </body>
    </html>
  );
}
