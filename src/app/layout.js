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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Back2Me Global — Just One Snap Away",
    description:
      "A global infrastructure of kindness. Protect what matters most.",
    type: "website",
  },
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
