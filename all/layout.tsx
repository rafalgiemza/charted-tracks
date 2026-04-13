import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/nav/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ChartPulse — Music Chart History",
    template: "%s | ChartPulse",
  },
  description:
    "Track how your favourite songs performed on music charts around the world.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    siteName: "ChartPulse",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
