import "@/app/globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "pakr88 — Your personal expedition outfitter",
  description: "Pack smart. Travel light. Your AI-powered gear companion for outdoor adventures.",
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
