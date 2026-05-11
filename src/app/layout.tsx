import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Display serif — used for headings and secondary display
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

// Clean sans — used for body text and UI labels
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-sans",
});

// Tech/Modern sans — used specifically for numbers and metrics
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AureumCV | Facial Geometry & Golden Ratio Analysis",
  description: "Advanced Real-Time Facial Geometry & Phi Analysis Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${cormorant.variable} ${dmSans.variable} ${spaceGrotesk.variable} font-sans bg-neutral-950 text-neutral-50 antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
