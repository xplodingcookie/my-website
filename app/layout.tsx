import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import Header from "./components/Header";

export const metadata = {
  title: "Dong Li - Software Developer",
  description: "Portfolio site for Dong Li - Mathematics & Computer Science",
};

const inter   = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-poppins" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-gradient-to-b from-purple-100 to-sky-50 text-neutral-900 antialiased selection:bg-amber-300 selection:text-neutral-900">
        <Header />
        <main id="top" className="pt-16 sm:pt-20">{children}</main>
        <footer className="text-center text-xs py-10 opacity-70">
          © {new Date().getFullYear()} Dong Li. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
