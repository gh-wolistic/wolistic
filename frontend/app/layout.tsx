import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wolistic | Body, Mind & Diet Wellness",
    template: "%s | Wolistic",
  },
  description:
    "Discover trusted wellness professionals, curated products, and evidence-led influencers across body, mind, and diet.",
  keywords: [
    "wellness platform",
    "holistic wellness",
    "nutrition experts",
    "fitness professionals",
    "mental wellness",
    "wellness products",
    "wellness influencers",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Wolistic | Body, Mind & Diet Wellness",
    description:
      "Discover trusted wellness professionals, curated products, and evidence-led influencers across body, mind, and diet.",
    url: siteUrl,
    siteName: "Wolistic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wolistic | Body, Mind & Diet Wellness",
    description:
      "Discover trusted wellness professionals, curated products, and evidence-led influencers across body, mind, and diet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
