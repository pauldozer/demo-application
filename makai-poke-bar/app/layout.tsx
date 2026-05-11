import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Makai Poke Bar | Fresh Hawaiian Poke Bowls in Beirut",
  description:
    "Makai Poke Bar brings authentic Hawaiian poke bowl culture to Beirut, Lebanon. Fresh ingredients, bold flavors, fully customizable bowls. Follow us @makai.lb",
  keywords: [
    "poke bowl",
    "Beirut",
    "Lebanon",
    "Hawaiian food",
    "healthy food",
    "Makai",
  ],
  openGraph: {
    title: "Makai Poke Bar | Fresh Hawaiian Poke Bowls in Beirut",
    description:
      "Fresh ingredients, bold flavors, fully customizable bowls in the heart of Beirut.",
    type: "website",
    locale: "en_US",
    siteName: "Makai Poke Bar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Makai Poke Bar | Fresh Hawaiian Poke Bowls in Beirut",
    description: "Fresh Hawaiian poke bowls in the heart of Beirut, Lebanon.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌊</text></svg>",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Makai Poke Bar",
  servesCuisine: "Hawaiian",
  description:
    "Authentic Hawaiian poke bowls in Beirut, Lebanon. Fresh ingredients, bold flavors.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "LB",
    addressLocality: "Beirut",
  },
  openingHours: "Mo-Su 11:00-22:00",
  sameAs: ["https://www.instagram.com/makai.lb"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
