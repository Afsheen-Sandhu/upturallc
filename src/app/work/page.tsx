"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LottiePlayer from "@/components/LottiePlayer";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import FloatingContactBtn from "@/components/FloatingContactBtn";

const PROJECTS = [
  {
    image: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/697123870c454ee58f48fdae_20260121_2326_Image%20Generation_remix_01kfgwtjnke6wvnz2gy4tz6az7%20(1).png',
    title: 'Little Ritual',
    year: '2024',
    category: 'Web Development',
    link: 'https://littlerituals.in/',
  },
  {
    image: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/697123871bb0b6d4190de8a8_20260121_2304_Image%20Generation_remix_01kfgvjndne5d91exwcm0tvwgx.png',
    title: 'The Chatter Bridge',
    year: '2023',
    category: 'Web Development',
    link: 'https://chatter-bridge.vercel.app/',
  },
  {
    image: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/697123876b6f9485bc779da3_20260121_2323_Image%20Generation_remix_01kfgwksbyf6wvky6jrt05bs4c.png',
    title: 'Camber',
    year: '2022',
    category: 'Web Development',
    link: 'https://www.camberco.ca/',
  },
  {
    image: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/69712387cdc93b53afb8642d_20260122_0004_Laptop%20Website%20Mockup_remix_01kfgyzneyffz8etnczt35ghkr%20(1).png',
    title: 'Lancemore',
    year: '2021',
    category: 'Web Development',
    link: 'https://lancemore.com.au/',
  },
  {
    image: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/6971238787a28e70e87e4f8f_20260121_2319_Image%20Generation_remix_01kfgwcxnxetxv9ak2dp56wb2r.png',
    title: 'Omumsie',
    year: '2020',
    category: 'Web Development',
    link: 'https://www.omumsie.com/',
  },
  {
    image: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/69712387c02df8f923e7198b_20260121_2314_Image%20Generation_remix_01kfgw409ye2vsw6590jca912p.png',
    title: 'PetEats',
    year: '2026',
    category: 'Web Development',
    link: 'https://www.peteats.pk/',
  }
];

const TESTIMONIALS = [
  {
    quote: "“Uptura turned our vague ideas into a razor-sharp digital reality. Their strategic approach to branding completely revitalized our market position.”",
    name: "Alex Petro",
    role: "Founder, TechFlow",
    image: "images/man.webp"
  },
  {
    quote: "“The design team is simply next level. They created a visual identity that feels both timeless and aggressively modern. Our customers love the new look.”",
    name: "David Miller",
    role: "CMO, BrightPath",
    image: "images/pexels-photo-2379004.jpeg"
  },
  {
    quote: "“We needed a partner who understood AI and UX equally. Uptura delivered a platform that is not only powerful but incredibly intuitive to use.”",
    name: "Michael Chen",
    role: "CTO, NextGen Systems",
    image: "images/photo-1692197393247-c76e1bd8f29e.jpg"
  }
];

function PortfolioCard({ project }: { project: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseEnter = () => {
    const el = cardRef.current;
    if (!el) return;
    gsap.to(el.querySelector('.card-image'), { scale: 1.05, duration: 0.5, ease: 'power2.out' });
    gsap.to(el.querySelector('.card-overlay'), { opacity: 0.5, duration: 0.5, ease: 'power2.out' });
    gsap.to(el.querySelector('.card-tags'), { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    gsap.to(el.querySelector('.card-button-wrapper'), { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
    gsap.to(el.querySelector('.card-info'), { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
  };

  const onMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    gsap.to(el.querySelector('.card-image'), { scale: 1, duration: 0.5, ease: 'power2.out' });
    gsap.to(el.querySelector('.card-overlay'), { opacity: 0, duration: 0.5, ease: 'power2.out' });
    gsap.to(el.querySelector('.card-tags'), { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' });
    gsap.to(el.querySelector('.card-button-wrapper'), { opacity: 0, scale: 0.8, duration: 0.5, ease: 'power2.in' });
    gsap.to(el.querySelector('.card-info'), { opacity: 0, y: 20, duration: 0.5, ease: 'power2.in' });
  };

  return (
    <div
      ref={cardRef}
      className="portfolio-card"
      style={{ width: "100%", height: "600px", position: "relative", overflow: "hidden", cursor: "pointer", borderRadius: "24px" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="card-image" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transition: "transform 0.5s ease" }}>
        <Image src={project.image} alt={project.title} fill sizes="(max-width: 768px) 100vw, 600px" style={{ objectFit: "cover" }} priority={false} quality={75} />
      </div>
      <div className="card-overlay" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "#000", opacity: 0, transition: "opacity 0.5s ease" }}></div>
      <div className="card-content" style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px", zIndex: 2 }}>
        <div className="card-tags" style={{ display: "flex", gap: "10px", opacity: 0, transform: "translateY(-20px)" }}>
          <span className="tag" style={{ padding: "8px 20px", border: "1px solid #fff", borderRadius: "30px", color: "#fff", fontSize: "0.9rem" }}>Branding</span>
          <span className="tag" style={{ padding: "8px 20px", border: "1px solid #fff", borderRadius: "30px", color: "#fff", fontSize: "0.9rem" }}>Digital Experience</span>
        </div>
        <div className="card-button-wrapper" style={{ display: "flex", justifyContent: "center", opacity: 0, transform: "scale(0.8)" }}>
           <button className="show-work-btn" style={{ padding: "18px 50px", background: "#FF3C00", color: "#fff", borderRadius: "50px", fontWeight: "bold", fontSize: "1.1rem" }}>SHOW WORK</button>
        </div>
        <div className="card-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", opacity: 0, transform: "translateY(20px)", color: "#fff" }}>
           <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{project.title}</h3>
           <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{project.year}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{project.category}</div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function Work() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  return (
    <div className="bg-[#EEE9E3]">
      <Navbar />
      <main>
        {/* HERO */}
        <section className="work-hero" style={{ padding: "180px 20px 80px", textAlign: "center", background: "#EEE9E3" }}>
            <div className="container centered-container">
                <div className="about-badge centered" style={{ display: "inline-flex", justifyContent: "center", marginBottom: "24px" }}>
                    <span className="badge-dot"></span> WORK
                </div>
                <h1 style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#1a1a1a", marginBottom: "24px" }}>Featured Work</h1>
                <p style={{ fontSize: "1.25rem", color: "#6B6763", maxWidth: "720px", margin: "0 auto 60px", fontWeight: 500 }}>
                    Providing top-notch branding, digital experiences, and web development through tailored solutions that fit your unique needs.
                </p>
                <div className="work-illustration">
                    <LottiePlayer
                        src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696252176759aeb999ea353b_9e6efd9b387f4cd4ba7ae90e158b5453.json"
                        style={{ width: "100%", maxWidth: "600px" }}
                    />
                </div>
            </div>
        </section>

        {/* LOGO MARQUEE */}
        <section className="section tricker home" style={{ background: "#EEE9E3", paddingBottom: "100px" }}>
          <div className="tricker-wrapper">
            <div className="tricker-single-wrap">
              <img src="/images/fictional-20company-20logo-2001.svg" loading="lazy" alt="Logo 01" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2002.svg" loading="lazy" alt="Logo 02" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2004.svg" loading="lazy" alt="Logo 04" className="tricker-single-image" />
              <div className="tricker-divider"></div>
            </div>
            <div className="tricker-single-wrap">
              <img src="/images/fictional-20company-20logo-2001.svg" loading="lazy" alt="Logo 01" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2002.svg" loading="lazy" alt="Logo 02" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2004.svg" loading="lazy" alt="Logo 04" className="tricker-single-image" />
              <div className="tricker-divider"></div>
            </div>
          </div>
        </section>

        {/* PORTFOLIO GRID */}
        <section className="portfolio-grid-container" style={{ background: "#EEE9E3", paddingBottom: "120px" }}>
           <div className="portfolio-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 600px)", gap: "40px", justifyContent: "center", margin: "0 auto", padding: "0 20px" }}>
              {PROJECTS.map((project, i) => (
                <PortfolioCard key={i} project={project} />
              ))}
           </div>
        </section>

        {/* INTERACTIVE TESTIMONIALS */}
        <section className="work-testimonials" style={{ padding: "120px 20px", background: "#EEE9E3", textAlign: "center" }}>
          <div className="container centered-container">
            <div className="about-badge centered" style={{ display: "inline-flex", justifyContent: "center", marginBottom: "40px" }}>
              <span className="badge-dot"></span> TESTIMONIALS
            </div>
            <div className="testimonial-content" style={{ maxWidth: "900px", margin: "0 auto 60px", minHeight: "220px" }}>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.7rem)", fontWeight: 700, lineHeight: 1.25, color: "#1a1a1a", marginBottom: "30px", letterSpacing: "-0.03em" }}>
                {TESTIMONIALS[currentTestimonial].quote}
              </h2>
              <div className="testimonial-meta">
                <span className="t-name" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800 }}>{TESTIMONIALS[currentTestimonial].name}</span>
                <span className="t-role" style={{ display: "block", color: "#6B6763", fontWeight: 600 }}>{TESTIMONIALS[currentTestimonial].role}</span>
              </div>
            </div>
            <div className="testimonial-selector" style={{ display: "flex", gap: "30px", justifyContent: "center" }}>
              {TESTIMONIALS.map((t, i) => (
                <div 
                  key={i} 
                  className={`t-selector-item ${currentTestimonial === i ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(i)}
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}
                >
                  <div className="t-image-wrapper" style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: currentTestimonial === i ? "4px solid #FF3C00" : "4px solid transparent", transition: "all 0.3s ease", position: "relative" }}>
                    <Image src={`/${t.image}`} alt={t.name} width={80} height={80} style={{ objectFit: "cover" }} quality={75} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="cta-section" style={{ padding: "120px 20px", background: "#EEE9E3" }}>
            <div className="cta-container-wrap">
                <div className="container cta-content" style={{ textAlign: "center" }}>
                    <h2 className="cta-title">Just one more step to make your perfect<br />choice</h2>
                    <h3 className="cta-subtitle">Click either button below to get started.</h3>
                    <div className="cta-actions" style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
                        <Link href="/contact" className="cta-button primary"><span>Book a Call</span></Link>
                        <Link href="/work" className="cta-button secondary"><span>Explore Work</span></Link>
                    </div>
                </div>
            </div>
        </section>

        {/* EXTRA LOTTIE */}
        <section className="extra-lottie" style={{ padding: "40px 0 100px", background: "#EEE9E3", display: "flex", justifyContent: "center" }}>
            <LottiePlayer
                src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/69764643ee2e3a0a80ac6ac6_538462768ae64e289157eae438455b72.json"
                style={{ width: "100%", maxWidth: "500px" }}
            />
        </section>

        <FloatingContactBtn />
      </main>
      <Footer />
    </div>
  );
}
