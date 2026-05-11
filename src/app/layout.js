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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Back2Me Global — The World's Smartest Lost & Found Platform",
    description: "Protect your loved ones and valuables with smart QR tags. No apps, no batteries. Just a direct line back to you.",
    url: "https://www.back2meglobal.com",
    siteName: "Back2Me Global",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Back2Me Global Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Back2Me Global — The World's Smartest Lost & Found Platform",
    description: "Protect your loved ones and valuables with smart QR tags. No apps, no batteries. Just a direct line back to you.",
    images: ["/twitter-image.png"],
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
