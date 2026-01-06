import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Face Clone - AI Face Swap",
  description: "Nano Banana Pro Engine Enabled",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
