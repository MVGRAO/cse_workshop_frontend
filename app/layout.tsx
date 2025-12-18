import type { Metadata } from "next";
import Script from "next/script";
import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "CSE Workshop ",
  description: "To develop and Evolp skills in Computer Science and Engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          async
          defer
        />
      </head>
      <body
        className={`${roboto.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
