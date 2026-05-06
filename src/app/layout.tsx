import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhotoRestore.ga — Restaurez vos anciennes photos avec l'IA",
  description: "Donnez une seconde vie à vos vieilles photos de famille. Restauration IA en moins d'une minute. Paiement par Orange Money, Wave ou carte. Satisfait ou non payé.",
  keywords: "restauration photo, ancienne photo, IA, Gabon, Afrique, Orange Money, Wave",
  openGraph: {
    title: "PhotoRestore.ga",
    description: "Restaurez vos anciennes photos avec l'IA",
    url: "https://photorestore.ga",
    siteName: "PhotoRestore.ga",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
