import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import CustomAutumnProvider from "@/lib/autumn-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log errors to console in development
            console.error('🚨 Application Error:', error, errorInfo)
            // You can add external error logging service here
            // Example: Sentry.captureException(error)
          }}
        >
          <CustomAutumnProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </CustomAutumnProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}