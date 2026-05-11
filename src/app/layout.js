import { Inter } from "next/font/google";
import MarketingTracker from "@/components/MarketingTracker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Back2Me Global — The World's Smartest Lost & Found Platform",
  description:
    "Protect your loved ones and valuables with smart QR tags. No apps, no batteries. Just a direct line back to you. Join the global recovery network.",
  keywords: "lost and found, QR tag, pet tag, luggage tag, recovery, Back2Me",
  manifest: "/site.webmanifest",
  // Note: Favicons, Apple Icons, OpenGraph, and Twitter images are auto-generated 
  // by Next.js using the file-based convention in the src/app/ directory 
  // (icon.png, apple-icon.png, opengraph-image.png, twitter-image.png, favicon.ico)
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <MarketingTracker />
        {children}
      </body>
    </html>
  );
}
