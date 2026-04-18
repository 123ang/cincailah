import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cincailah.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Cincailah — Decide Where to Makan in 10 Seconds",
    template: "%s — Cincailah",
  },
  description:
    "Stop wasting lunch break debating. Cincailah spins a restaurant or runs a group vote in seconds. No more 'makan apa?' drama.",
  keywords: ["makan", "lunch decider", "restaurant picker", "group food decision", "Malaysia", "KL"],
  authors: [{ name: "Cincailah" }],
  creator: "Cincailah",
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: APP_URL,
    siteName: "Cincailah",
    title: "Cincailah — Decide Where to Makan in 10 Seconds",
    description:
      "Stop wasting lunch break debating. Spin a restaurant or run a group vote in seconds.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Cincailah — Makan Mana?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cincailah — Decide Where to Makan in 10 Seconds",
    description:
      "Stop wasting lunch break debating. Spin a restaurant or run a group vote in seconds.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#DC2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cincailah" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && d)) document.documentElement.classList.add('dark');
              } catch(e){}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
