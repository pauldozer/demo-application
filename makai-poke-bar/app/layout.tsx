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
  title: "Makai Poke Bar | Fresh Hawaiian Poke Bowls in Tripoli",
  description:
    "Makai Poke Bar brings authentic Hawaiian poke bowl culture to Tripoli, Lebanon. Fresh ingredients, bold flavors, fully customizable bowls. Follow us @makai.lb",
  keywords: [
    "poke bowl",
    "Tripoli",
    "Lebanon",
    "Hawaiian food",
    "healthy food",
    "Makai",
    "Tarik El Mina",
  ],
  openGraph: {
    title: "Makai Poke Bar | Fresh Hawaiian Poke Bowls in Tripoli",
    description:
      "Fresh ingredients, bold flavors, fully customizable bowls in the heart of Tripoli.",
    type: "website",
    locale: "en_US",
    siteName: "Makai Poke Bar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Makai Poke Bar | Fresh Hawaiian Poke Bowls in Tripoli",
    description: "Fresh Hawaiian poke bowls in Tarik El Mina, Tripoli, Lebanon.",
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
    "Authentic Hawaiian poke bowls in Tripoli, Lebanon. Fresh ingredients, bold flavors.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "LB",
    addressLocality: "Tripoli",
    streetAddress: "Tarik El Mina",
  },
  telephone: "+96176173251",
  geo: {
    "@type": "GeoCoordinates",
    latitude: "34.4404617",
    longitude: "35.8298546",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "12:00", closes: "23:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "12:00", closes: "00:00" },
  ],
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
