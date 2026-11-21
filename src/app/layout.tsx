import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brownsville Estate Sale – Quality Furniture, Home Décor & More!",
  description:
    "Large estate sale in Brownsville, Texas featuring quality furniture, home furnishings, kitchenware, and outdoor items. Wednesday, Friday & Saturday of Thanksgiving week. Everything must go!",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
