import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import CustomAutumnProvider from "@/lib/autumn-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "9TD - Task Dashboard",
  description: "Advanced task management dashboard with projects, time tracking, and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>
        <CustomAutumnProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </CustomAutumnProvider>
      </body>
    </html>
  );
}