import type { Metadata } from 'next';
import { Outfit, DM_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SheetSane - Spreadsheet Sanity Checker',
  description: 'Instantly analyze your Excel spreadsheets for errors, inconsistencies, and data quality issues. Get a comprehensive sanity report in seconds.',
  keywords: ['spreadsheet', 'excel', 'analysis', 'data quality', 'error detection', 'xlsx'],
  authors: [{ name: 'SheetSane' }],
  openGraph: {
    title: 'SheetSane - Spreadsheet Sanity Checker',
    description: 'Instantly analyze your Excel spreadsheets for errors and data quality issues.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <span className="font-display text-xl font-bold text-foreground">SheetSane</span>
              </a>
              <div className="text-sm text-foreground/60">
                Spreadsheet Sanity Checker
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-border/50 py-6">
            <div className="max-w-6xl mx-auto px-4 text-center text-sm text-foreground/40">
              <p>© {new Date().getFullYear()} SheetSane. One-time analysis, no account required.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
