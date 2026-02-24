import type { Metadata } from "next";
import "./globals.css";
import { Oswald } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";

const oswald = Oswald({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STiNE Ultras",
  description: "Macht Kurse wählen ultra einfach.",
  applicationName: "STiNE Ultras",
  icons: [
    {
      url: "/icons/betterstine.svg",
      sizes: "512x512",
      type: "image/svg+xml",
    },
  ],
  authors: [
    {
      name: "Ben",
    },
    {
      name: "Moritz",
    },
    {
      name: "Robin",
    },
  ],
  keywords: [
    "STiNE",
    "Theme",
    "Modern",
    "Updated",
    "UHH",
    "Uni Hamburg",
    "University of Hamburg",
    "Universität Hamburg",
    "stine",
    "stine uhh",
    "stine theme",
    "stine modern",
    "stine updated",
    "stine ultras",
  ],
  generator: "Next.js",
  appleWebApp: true,
  openGraph: {
    title: "STiNE Ultras",
    description:
      "Macht Kurse wählen ultra einfach.",
    url: "https://stineultras.de",
    type: "website",
    images: [
      {
        url: "https://stineultras.de/preview.png",
        width: 3456,
        height: 1576,
        type: "image/png",
        alt: "STiNE Ultras Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "STiNE Ultras",
    description:
      "Macht Kurse wählen ultra einfach.",
    images: ["https://stineultras.de/preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Analytics />
      <body
        className={`${oswald.className} antialiased bg-ocean flex flex-col min-h-screen`}>
        <Toaster richColors position="top-right" />
        <div className="flex-grow">{children}</div>
        <div>
          <div className="text-white text-center text-lg sm:text-xl font-semibold">
            <p>STiNE Ultras- Nicht affiliert mit UHH</p>
          </div>
        </div>
        <footer className="bg-ocean w-full">
          <div className="flex gap-2 text-white items-center justify-center p-4">
            <Link href="/info/contact" className="hover:underline">
              Kontakt
            </Link>
            <Link href="/info/credits" className="hover:underline">
              Credits
            </Link>
            <Link href="/info/privacy" className="hover:underline">
              Privacy
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
