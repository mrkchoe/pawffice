import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { DemoProvider } from "@/lib/demo/store";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pawffice — Your WFH coworker has four legs",
  description:
    "Match with shelter dogs that fit your home, energy, and schedule — then book a visit automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
