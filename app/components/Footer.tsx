import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/#top" className="footer-signature" aria-label="Dong Li — back to top"><Image src="/frog_transparent.png" alt="" width={30} height={30} /><span>Made with curiosity.</span></Link>
        <p>© {new Date().getFullYear()} Dong Li</p>
        <Link href="/#top" className="link-underline">Back to top ↑</Link>
      </div>
    </footer>
  );
}
