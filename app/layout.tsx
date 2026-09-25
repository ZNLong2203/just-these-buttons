import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible was drawn by the Braille Institute for low-vision
// readers — the people this app ultimately prints for.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-atkinson",
  adjustFontFallback: false,
  display: "swap",
});

// Atkinson has no Vietnamese glyphs; a card in Vietnamese switches to a face
// designed for its stacked diacritics (see :lang(vi) in globals.css).
const vietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-vietnam",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  weight: ["600"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Just These Buttons",
  description:
    "Photograph a machine your grandparent struggles with, name one task, and print a card that shows only the buttons that task needs.",
};

export const viewport: Viewport = {
  themeColor: "#f7f3ec",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${atkinson.variable} ${vietnam.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
