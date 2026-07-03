import "./globals.css";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Preloader from "./components/Preloader";
import SmoothScroll from "./components/SmoothScroll";

export const metadata = {
  title: "Dong Li - Software Developer",
  description: "Portfolio site for Dong Li - Mathematics & Computer Science",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const myFont = localFont({
  src: [
    { path: "./fonts/Altinn-DINExp.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Altinn-DINExp-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-myfont",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${myFont.variable}`}>
      <body className="bg-gradient-to-b from-purple-100 to-sky-50 text-neutral-900 antialiased">
        <Preloader />
        <SmoothScroll />
        <Header />
        <main id="top" className="pt-16 sm:pt-20">
          {children}
        </main>
        <Footer />
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
