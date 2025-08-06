"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./contexts/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  return {
    title: "SocialApp",
    description: "A social media app for developers",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL),
    robots: { index: false, follow: false },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" title="SocialApp">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-white`}
      >
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
