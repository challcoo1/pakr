import "@/app/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Pakr",
  description: "Pakr application",
};

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
};

export default Layout;
