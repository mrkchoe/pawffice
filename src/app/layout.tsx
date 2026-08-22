import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { PhosphorProvider } from "@/components/icons/PhosphorProvider";
import { DemoProvider } from "@/lib/demo/store";
import "./globals.css";

/** Rounded sans-serif for body and titles. */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <PhosphorProvider>
          <DemoProvider>{children}</DemoProvider>
        </PhosphorProvider>
      </body>
    </html>
  );
}
