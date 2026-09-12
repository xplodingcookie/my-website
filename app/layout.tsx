import "./globals.css";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Preloader from "./components/Preloader";
import SmoothScroll from "./components/SmoothScroll";
import MotionProvider from "./components/MotionProvider";

export const metadata = {
  title: "Dong Li — Software Engineer",
  description:
    "Software engineer and data scientist in Melbourne, working where mathematics meets computer science: healthcare integrations, data science, and an interactive Simplex playground.",
  openGraph: {
    title: "Dong Li — Software Engineer",
    description:
      "Mathematics × computer science: healthcare integrations, data science, and an interactive Simplex playground.",
    type: "website",
  },
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
      <body>
        <noscript><style>{`.needs-js{display:none!important}`}</style></noscript>
        <MotionProvider>
          <Preloader />
          <a href="#main-content" className="skip-link">Skip to content</a>
          <SmoothScroll />
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <div className="grain" aria-hidden="true" />
        </MotionProvider>
      </body>
    </html>
  );
}
