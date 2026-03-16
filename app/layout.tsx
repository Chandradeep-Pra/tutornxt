import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TutorNxt Voice Tutor",
  description: "A voice-first English tutor built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
