import type { Metadata } from "next";
import { Inter, DM_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-custom",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  variable: "--font-mono-custom",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  variable: "--font-serif-custom",
  subsets: ["latin"],
  display: "swap",
});

import AuthProviderWrapper from "@/components/auth/AuthProviderWrapper";

export const metadata: Metadata = {
  title: "Recall.ai — Turn Textbooks Into Typewriter Test Cloze Games",
  description: "An AI-powered browser spaced-repetition tool built for advanced medicine, law, and STEM students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-bg text-text selection:bg-active/30 selection:text-white"
        suppressHydrationWarning
      >
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
