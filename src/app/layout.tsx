import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Planet Messaging — Business Messaging Platform',
  description: 'Send and receive SMS, WhatsApp, RCS, and email from one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Set dark/light class before first paint — avoids flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=new Date().getHours();document.documentElement.classList.add(h>=18||h<6?'dark':'light');})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
