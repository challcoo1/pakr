import "@/app/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "pakr — Your personal expedition outfitter",
  description: "Pack smart. Travel light. Your AI-powered gear companion for outdoor adventures.",
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
