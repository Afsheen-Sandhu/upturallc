import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Uptura | Expert Web Development, SEO & AI Solutions for Business",
  description: "Uptura is a premier digital agency specializing in custom web development, SEO strategies, and AI consultancy to scale your business.",
  keywords: ["web development", "SEO services", "AI consultancy", "digital agency", "Uptura", "custom software", "digital marketing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/mouse-follower@1/dist/mouse-follower.min.css" />
      </head>
      <body
        className={`${inter.variable} antialiased min-h-full flex flex-col font-sans`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
