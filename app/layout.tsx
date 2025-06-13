import './globals.css';

export const metadata = {
  title: 'My Portfolio',
  description: 'Personal portfolio of Your Name',
};

export default function RootLayout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="fixed inset-x-0 top-0 z-10 backdrop-blur bg-white/60 border-b border-black/5 flex justify-between px-8 py-3">
          <div className="font-semibold">MyPortfolio</div>
          <nav className="space-x-6">
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>
        <main className="pt-20">{children}</main>
        <footer className="text-center text-sm opacity-70 py-8">
          © {new Date().getFullYear()} Your Name. All rights reserved.
        </footer>
      </body>
    </html>
  );
}