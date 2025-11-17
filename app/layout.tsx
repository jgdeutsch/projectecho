import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Echo - LinkedIn Likers Scraper",
  description: "Scrape LinkedIn post likers using PhantomBuster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

