import type { Metadata } from "next";
import { DM_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vacayza — Cape Town Short-Term Rental Investments",
  description:
    "Own a curated short-term rental in Cape Town with transparent projections, full-service management, and hard-currency income potential.",
  openGraph: {
    title: "Vacayza — Cape Town Short-Term Rental Investments",
    description:
      "Discover Cape Town short-term rental opportunities with vetted properties and professional management.",
    type: "website",
    siteName: "Vacayza",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmMono.variable}`}>
      <body className="bg-vacayza-black text-vacayza-off-white antialiased">
        {children}
      </body>
    </html>
  );
}
