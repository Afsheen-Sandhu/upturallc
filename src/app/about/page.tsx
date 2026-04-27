"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LottiePlayer from "@/components/LottiePlayer";
import Link from "next/link";
import FloatingContactBtn from "@/components/FloatingContactBtn";

export default function About() {
  return (
    <div className="bg-[#EEE9E3]">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="hero about-hero">
          <div className="container">
            <div className="hero-inner">
              <div className="hero-left">
                <div className="about-badge">
                  <span className="badge-dot"></span> ABOUT US
                </div>
                <h1 className="hero-title">
                  Building Smarter<br />
                  Businesses with<br />
                  AI & Digital<br />
                  Innovation
                </h1>
                <Link href="/contact" className="book-call" style={{ marginTop: "60px", gap: "12px" }}>
                  <span className="book-call-text">
                    <span>BOOK A CALL</span>
                    <span>BOOK A CALL</span>
                  </span>
                  <span className="book-call-arrow">
                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 15L15 1M15 1H5M15 1V11" stroke="#ff5722" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </div>

              <div className="hero-right">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                  <LottiePlayer
                    src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696e675bf416ec5c93b35fdf_9911a27978ce49acb6c6778ee76cf6b8.json"
                    className="about-hero-lottie"
                    style={{ width: "100%", height: "auto", marginBottom: "20px" }}
                  />
                  <p className="hero-subtext"
                    style={{ fontSize: "1rem", lineHeight: "1.5", color: "#555", maxWidth: "350px", marginLeft: "18%", paddingLeft: 0 }}>
                    Our services help you create digital products and solve your problems objectively,
                    strategy, technology and design.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* What We Do Section */}
        <section className="what-we-do-section">
          <div className="container">
            <div className="what-we-do-grid">
              <div className="what-we-do-left">
                <LottiePlayer
                  src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/695ff7476edb6b51c6ef2bcd_63834eb7c03546b9920a62dc1ff05990.json"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
              <div className="what-we-do-right">
                <div className="about-badge" style={{ marginBottom: "20px" }}>
                  <span className="badge-dot" style={{ backgroundColor: "#FF3C00" }}></span> WHAT WE DO?
                </div>
                <h2 className="what-we-do-text">
                  At <span className="highlight">Uptura</span>, we help businesses grow smarter, faster, and more
                  efficiently by combining <span className="bold">AI consultancy</span> with <span
                    className="bold">high-impact digital services.</span>
                </h2>
                <p className="what-we-do-subtext">
                  With over <span className="bold">6 years of hands-on experience</span>, we’ve worked with
                  startups, growing companies, and established brands to design systems.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Logo Marquee Section */}
        <section className="section tricker home">
          <div className="tricker-wrapper">
            <div className="tricker-single-wrap">
              <img src="/images/fictional-20company-20logo-2001.svg" loading="lazy" alt="Logo 01" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2002.svg" loading="lazy" alt="Logo 02" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2003.svg" loading="lazy" alt="Logo 03" className="tricker-single-image" />
              <div className="tricker-divider"></div>
            </div>
            <div className="tricker-single-wrap">
              <img src="/images/fictional-20company-20logo-2001.svg" loading="lazy" alt="Logo 01" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2002.svg" loading="lazy" alt="Logo 02" className="tricker-single-image" />
              <div className="tricker-divider"></div>
              <img src="/images/fictional-20company-20logo-2003.svg" loading="lazy" alt="Logo 03" className="tricker-single-image" />
              <div className="tricker-divider"></div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Vision Section */}
        <section className="vision-section">
          <div className="container">
            <div className="vision-badge">
              <span className="badge-dot"></span> OUR VISION
            </div>
            <h2 className="vision-title">
              To become a trusted global partner for AI-driven and digital transformation, helping businesses
              operate smarter, scale faster, and stay competitive in an evolving<br />digital world.
            </h2>
            <div className="vision-lottie">
              <LottiePlayer
                src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696a7851ae97c9acc07fa1e4_ef389b008dbe4cf5ac22769de9f07dc3.json"
                style={{ width: "100%", maxWidth: "800px", height: "auto", margin: "0 auto" }}
              />
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Marquee Section */}
        <section className="marquee-section">
          <div className="marquee-wrapper">
            <div className="marquee-content">
              <div className="marquee-item">Web Development <div className="marquee-dot"></div></div>
              <div className="marquee-item">Digital Experiences <div className="marquee-dot"></div></div>
              <div className="marquee-item">SEO Optimization <div className="marquee-dot"></div></div>
              <div className="marquee-item">AI Solutions <div className="marquee-dot"></div></div>
              <div className="marquee-item">Strategic Design <div className="marquee-dot"></div></div>
            </div>
            <div className="marquee-content">
              <div className="marquee-item">Web Development <div className="marquee-dot"></div></div>
              <div className="marquee-item">Digital Experiences <div className="marquee-dot"></div></div>
              <div className="marquee-item">SEO Optimization <div className="marquee-dot"></div></div>
              <div className="marquee-item">AI Solutions <div className="marquee-dot"></div></div>
              <div className="marquee-item">Strategic Design <div className="marquee-dot"></div></div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        <div className="section-divider"></div>

        {/* Services Grid Section */}
        <section className="services-grid-section">
          <div className="services-container">
            <div className="services-grid">
              {/* CARD 1: Custom Website Development */}
              <div className="service-card">
                <div className="card-header">
                  <div className="card-icon"></div>
                  <h3 className="card-title">Custom Website Development</h3>
                </div>
                <p className="card-subtitle">Your website is your digital headquarters</p>
                <ul className="features-list">
                  <li className="feature-item"><span className="feature-dot"></span><span>Custom websites tailored to your business goals</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Fast, secure, and scalable architectures</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Conversion-focused layouts</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Mobile-responsive experiences</span></li>
                </ul>
                <div className="card-result">
                  <p className="result-text">Websites that don't just look good — they convert.</p>
                </div>
              </div>

              {/* CARD 2: Mobile App Development */}
              <div className="service-card">
                <div className="card-header">
                  <div className="card-icon"></div>
                  <h3 className="card-title">Mobile App Development (Android & iOS)</h3>
                </div>
                <p className="card-subtitle">Turn your idea into a powerful mobile experience.</p>
                <ul className="features-list">
                  <li className="feature-item"><span className="feature-dot"></span><span>Native & cross-platform apps</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Android & iOS applications</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Secure, scalable backends</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Smooth UI/UX flows</span></li>
                </ul>
                <div className="card-result">
                  <p className="result-text">Apps users love and businesses can scale with.</p>
                </div>
              </div>

              {/* CARD 3: Social Media Marketing */}
              <div className="service-card">
                <div className="card-header">
                  <div className="card-icon"></div>
                  <h3 className="card-title">Social Media Marketing</h3>
                </div>
                <p className="card-subtitle">We help brands turn attention into revenue.</p>
                <ul className="features-list">
                  <li className="feature-item"><span className="feature-dot"></span><span>Content strategy & planning</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Paid ad campaigns</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Audience targeting & growth</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Performance tracking</span></li>
                </ul>
                <div className="card-result">
                  <p className="result-text">Strong brand presence + measurable results.</p>
                </div>
              </div>

              {/* CARD 4: Search Engine Optimization */}
              <div className="service-card">
                <div className="card-header">
                  <div className="card-icon"></div>
                  <h3 className="card-title">Search Engine Optimization (SEO)</h3>
                </div>
                <p className="card-subtitle">If customers can't find you, you don't exist.</p>
                <ul className="features-list">
                  <li className="feature-item"><span className="feature-dot"></span><span>On-page & technical SEO</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Keyword research & strategy</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Content optimization</span></li>
                  <li className="feature-item"><span className="feature-dot"></span><span>Local & global SEO</span></li>
                </ul>
                <div className="card-result">
                  <p className="result-text">Higher rankings, consistent traffic, long-term ROI.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Mission Details */}
        <div className="mission-lottie-container">
          <LottiePlayer
            src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/697646bf6c8cf00dca5c698e_f018671074534edb8da923cac75619cb.json"
            style={{ width: "100%", maxWidth: "800px", height: "auto", margin: "0 auto" }}
          />
        </div>

        <div className="container" style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="about-badge" style={{ display: "inline-flex", justifyContent: "center" }}>
            <span className="badge-dot" style={{ backgroundColor: "#FF3C00" }}></span> OUR MISSION
          </div>
        </div>

        <section className="ai-process">
          <div className="container">
            <div className="process-steps">
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-rocket"></i></div>
                <div className="step-content">
                  <h3>Our Goal</h3>
                  <p>To empower businesses with intelligent AI and digital innovation.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-cogs"></i></div>
                <div className="step-content">
                  <h3>Workflow Optimization</h3>
                  <p>We help organizations optimize workflows and modernize operations.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-chart-line"></i></div>
                <div className="step-content">
                  <h3>Performance at Scale</h3>
                  <p>Our solutions are designed to improve performance and efficiency at scale.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-lightbulb"></i></div>
                <div className="step-content">
                  <h3>Simplicity First</h3>
                  <p>We believe technology should simplify work, not complicate it.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-gem"></i></div>
                <div className="step-content">
                  <h3>Strategic Excellence</h3>
                  <p>Every project is built with strategy, precision, and long-term value in mind.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-seedling"></i></div>
                <div className="step-content">
                  <h3>Sustainable Growth</h3>
                  <p>Our goal is to deliver solutions that drive sustainable growth.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-container-wrap">
            <div className="container cta-content">
               <LottiePlayer 
                src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/6976461cc4f6f1932be43d69_5146020a7bf240ee8ce7bcf890c843dd.json"
                style={{ width: "200px", height: "200px", margin: "0 auto" }}
               />
              <h2 className="cta-title">Just one more step to make<br />your perfect choice</h2>
              <h3 className="cta-subtitle">Click either button below to get started.</h3>
              <div className="cta-actions">
                <Link href="/contact" className="cta-button primary"><span>Book a Call</span></Link>
                <Link href="/ai-consultancy" className="cta-button secondary"><span>AI Services</span></Link>
              </div>
            </div>
            <div className="floating-btn">Contact Us</div>
          </div>
        </section>
        <FloatingContactBtn />
      </main>
      <Footer />
    </div>
  );
}
