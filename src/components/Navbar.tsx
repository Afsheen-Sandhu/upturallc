"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav id="navbar-placeholder" className={`custom-navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <Image src="/images/logo-main.png" className="logo-img" alt="Uptura Logo" width={120} height={56} priority />
          </Link>

          <ul className="nav-links">
            <li className="nav-item" style={{ opacity: 1, transform: "none" }}>
              <Link href="/about" className="nav-link"><span>About</span></Link>
            </li>
            <li className="nav-item" style={{ opacity: 1, transform: "none" }}>
              <Link href="/digital-solutions" className="nav-link"><span>Digital Solutions</span></Link>
            </li>
            <li className="nav-item" style={{ opacity: 1, transform: "none" }}>
              <Link href="/ai-consultancy" className="nav-link"><span>AI Consulting</span></Link>
            </li>
            <li className="nav-item" style={{ opacity: 1, transform: "none" }}>
              <Link href="/consultation" className="nav-link"><span>Consultation</span></Link>
            </li>
            <li className="nav-item" style={{ opacity: 1, transform: "none" }}>
              <Link href="/work" className="nav-link"><span>Works</span></Link>
            </li>
            <li className="nav-item" style={{ opacity: 1, transform: "none" }}>
              <Link href="/contact" className="nav-link"><span>Contact</span></Link>
            </li>
          </ul>

          <Link href="/contact" className="cta-button"><span>Get Started</span></Link>

          <button 
            className={`hamburger ${isOpen ? "active" : ""}`} 
            id="nav-toggle"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </nav>

      <div 
        className="mobile-dropdown" 
        id="mobile-menu" 
        style={{ 
          display: isOpen ? "block" : "none", 
          opacity: isOpen ? 1 : 0 
        }}
      >
        <ul className="mobile-links">
          <li className="mobile-item" style={{ opacity: 1, transform: "none" }}>
            <Link href="/about" className="mobile-link" onClick={() => setIsOpen(false)}>About</Link>
          </li>
          <li className="mobile-item" style={{ opacity: 1, transform: "none" }}>
            <Link href="/digital-solutions" className="mobile-link" onClick={() => setIsOpen(false)}>Digital Solutions</Link>
          </li>
          <li className="mobile-item" style={{ opacity: 1, transform: "none" }}>
            <Link href="/ai-consultancy" className="mobile-link" onClick={() => setIsOpen(false)}>AI Consulting</Link>
          </li>
          <li className="mobile-item" style={{ opacity: 1, transform: "none" }}>
            <Link href="/consultation" className="mobile-link" onClick={() => setIsOpen(false)}>Consultation</Link>
          </li>
          <li className="mobile-item" style={{ opacity: 1, transform: "none" }}>
            <Link href="/work" className="mobile-link" onClick={() => setIsOpen(false)}>Works</Link>
          </li>
          <li className="mobile-item" style={{ opacity: 1, transform: "none" }}>
            <Link href="/contact" className="mobile-link" onClick={() => setIsOpen(false)}>Contact</Link>
          </li>
        </ul>
      </div>
    </>
  );
}
