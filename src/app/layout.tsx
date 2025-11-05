import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";

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
        {/* ULTIMATE CACHE DESTROYER - v4.0 FINAL */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0, pre-check=0, post-check=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="-1" />
        <meta name="cache-version" content={`v4-ultimate-${Date.now()}`} />
        
        {/* ULTIMATE FORCE RELOAD - CLEARS EVERYTHING */}
        <Script id="ultimate-cache-destroyer" strategy="beforeInteractive">
          {`
            (function() {
              const ULTIMATE_VERSION = 'v4-ultimate-oct21-final-${Date.now()}';
              const lastVersion = sessionStorage.getItem('ultimate-app-version');
              
              // ALWAYS clear everything on first load
              if (!lastVersion || lastVersion !== ULTIMATE_VERSION) {
                console.log('🚀 ULTIMATE CACHE CLEAR - Destroying all caches...');
                
                // Set new version FIRST
                sessionStorage.setItem('ultimate-app-version', ULTIMATE_VERSION);
                localStorage.setItem('ultimate-app-version', ULTIMATE_VERSION);
                
                // 1. Unregister ALL service workers
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(regs => {
                    regs.forEach(reg => {
                      reg.unregister();
                      console.log('✅ Unregistered service worker');
                    });
                  });
                }
                
                // 2. Delete ALL cache storage
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => {
                      caches.delete(name);
                      console.log('✅ Deleted cache:', name);
                    });
                  });
                }
                
                // 3. Clear IndexedDB
                if (window.indexedDB && window.indexedDB.databases) {
                  window.indexedDB.databases().then(dbs => {
                    dbs.forEach(db => {
                      if (db.name && (db.name.includes('next') || db.name.includes('cache'))) {
                        window.indexedDB.deleteDatabase(db.name);
                        console.log('✅ Deleted IndexedDB:', db.name);
                      }
                    });
                  });
                }
                
                // 4. Force reload with timestamp
                const reloadCount = parseInt(sessionStorage.getItem('reload-count') || '0');
                if (reloadCount < 2) {
                  sessionStorage.setItem('reload-count', String(reloadCount + 1));
                  console.log('🔄 Forcing hard reload...', reloadCount + 1);
                  setTimeout(() => {
                    window.location.href = window.location.href + '?bust=' + Date.now();
                  }, 100);
                } else {
                  sessionStorage.removeItem('reload-count');
                  console.log('✅ Cache clear complete! App should show 5 tabs only.');
                }
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}