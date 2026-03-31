"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LottiePlayer from "@/components/LottiePlayer";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import FloatingContactBtn from "@/components/FloatingContactBtn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TIERS_BY_SERVICE: Record<string, any[]> = {
  web: [
    { tier: 'hourly', label: '⏱ Hourly Rate', price: '$35–$50/hr' },
    { tier: 'project', label: '📦 Project-Based', price: '$2,500–$8,000+', recommended: true },
    { tier: 'monthly', label: '🔁 Monthly Maintenance', price: '$150–$400/mo' }
  ],
  redesign: [
    { tier: 'hourly', label: '⏱ Hourly', price: '$35–$45/hr' },
    { tier: 'project', label: '📦 Full Redesign', price: '$2,000–$6,500+', recommended: true },
    { tier: 'monthly', label: '🔁 Monthly', price: 'Custom' }
  ],
  social: [
    { tier: 'hourly', label: '⏱ Hourly', price: '$25–$35/hr' },
    { tier: 'monthly', label: '🔁 Monthly Retainer', price: '$400–$1,200/mo', recommended: true },
    { tier: 'campaign', label: '📦 Campaign-Based', price: 'Custom' }
  ],
  seo: [
    { tier: 'hourly', label: '⏱ Hourly', price: '$25–$40/hr' },
    { tier: 'monthly', label: '🔁 Monthly Retainer', price: '$300–$1,000/mo', recommended: true },
    { tier: 'sprint', label: '📦 SEO Sprint', price: 'Custom' }
  ],
  app: [
    { tier: 'hourly', label: '⏱ Hourly', price: '$30–$45/hr' },
    { tier: 'project', label: '📦 Project-Based', price: '$3,000–$12,000+', recommended: true },
    { tier: 'monthly', label: '🔁 Monthly', price: 'Custom' }
  ]
};

const SERVICE_NAME_MAP: Record<string, string> = {
  web: 'Custom Web Development', 
  redesign: 'Website Redesign',
  social: 'Social Media Marketing', 
  seo: 'SEO Services', 
  app: 'App Development'
};

export default function DigitalSolutions() {
  const [activeService, setActiveService] = useState('web');
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  
  const solutionStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!solutionStackRef.current) return;
    const cards = gsap.utils.toArray(".digital-solution-card") as HTMLElement[];

    cards.forEach((card, index) => {
      if (index === cards.length - 1) return; // Last card doesn't need to pin
      ScrollTrigger.create({
        trigger: card,
        start: "top 120",
        pin: true,
        pinSpacing: false,
        endTrigger: solutionStackRef.current,
        end: "bottom bottom",
        scrub: true
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handlePlaceOrder = () => {
    if (!selectedTier) {
      setToastMessage("Please select a billing model first! ✨");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const params = new URLSearchParams();
    params.set('category', 'digital');
    params.set('service', activeService);
    params.set('tier', selectedTier.tier);
    params.set('plan', SERVICE_NAME_MAP[activeService] + ' – ' + selectedTier.label);
    params.set('price', selectedTier.price);
    window.location.href = '/checkout?' + params.toString();
  };

  return (
    <div className="bg-[#EEE9E3]">
      <Navbar />
      <main>
        {/* HERO */}
        <section className="digital-hero">
          <div className="container" style={{ textAlign: "center" }}>
            <div className="about-badge" style={{ display: "inline-flex", justifyContent: "center", marginBottom: "30px" }}>
              <span className="badge-dot"></span> SOLUTIONS
            </div>
            <h1 style={{ fontSize: "clamp(3rem, 7vw, 5rem)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: "#1a1a1a", marginBottom: "30px" }}>
              High-Impact Digital<br />
              <span style={{ color: "#FF3C00" }}>Excellence.</span>
            </h1>
            <p style={{ fontSize: "1.25rem", color: "#6B6763", maxWidth: "700px", margin: "0 auto 60px", fontWeight: 500 }}>
              Specialized services tailored to your business needs. 
              We help you build, grow, and dominate your market.
            </p>
            <LottiePlayer 
              src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/69711676f416ec5c93b70836_f1659710f27448d49a7171f654b5dfa4.json"
              style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}
            />
          </div>
        </section>

        {/* STACKED SOLUTIONS */}
        <section ref={solutionStackRef} className="ai-solutions-stack" style={{ padding: "100px 20px" }}>
          <div className="digital-solution-card solution-card" style={{ maxWidth: "1200px", margin: "0 auto 60px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
              <div>
                <div className="solution-icon-box" style={{ background: "#FFEDE9", width: "80px", height: "80px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "30px" }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 10C5 7.23858 7.23858 5 10 5H30C32.7614 5 35 7.23858 35 10V30C35 32.7614 32.7614 35 30 35H10C7.23858 35 5 32.7614 5 30V10Z" stroke="#FF3C00" strokeWidth="3"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "20px", color: "#1a1a1a" }}>Targeted Performance</h3>
                <p style={{ fontSize: "1.1rem", color: "#6B6763", lineHeight: 1.6, marginBottom: "30px" }}>
                  We don&apos;t just build; we optimize. Every project is measured against KPIs that matter to your bottom line.
                </p>
                <Link href="#pricing" className="service-btn" style={{ textDecoration: "none" }}>View Plans</Link>
              </div>
              <LottiePlayer src="https://assets2.lottiefiles.com/packages/lf20_at6mdfsw.json" style={{ width: "100%", height: "auto" }} />
            </div>
          </div>

          <div className="digital-solution-card solution-card" style={{ maxWidth: "1200px", margin: "0 auto 60px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
              <LottiePlayer src="https://assets1.lottiefiles.com/packages/lf20_gw969vpx.json" style={{ width: "100%", height: "auto" }} />
              <div>
                <div className="solution-icon-box" style={{ background: "#E8F5E9", width: "80px", height: "80px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "30px" }}>
                   <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 5L35 20L20 35L5 20L20 5Z" stroke="#4CAF50" strokeWidth="3"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "20px", color: "#1a1a1a" }}>Seamless Experiences</h3>
                <p style={{ fontSize: "1.1rem", color: "#6B6763", lineHeight: 1.6, marginBottom: "30px" }}>
                  Consistency across all digital touchpoints. We ensure your brand voice is heard loudly and clearly on every device.
                </p>
                <Link href="/work" className="service-btn" style={{ textDecoration: "none" }}>Our Work</Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SELECTOR */}
        <section id="pricing" style={{ padding: "120px 20px", background: "#ffffff" }}>
          <div className="container">
            <h2 style={{ fontSize: "3rem", fontWeight: 800, textAlign: "center", marginBottom: "60px" }}>Strategic <span style={{ color: "#FF3C00" }}>Pricing Models.</span></h2>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "60px" }}>
              {Object.keys(TIERS_BY_SERVICE).map(s => (
                <button 
                  key={s} 
                  className={`service-btn ${activeService === s ? 'active' : ''}`}
                  onClick={() => { setActiveService(s); setSelectedTier(null); }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1).replace('redesign', 'Redesign')}
                </button>
              ))}
            </div>

            <div className="pricing-table-container">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "30px" }}>
                {TIERS_BY_SERVICE[activeService].map(t => (
                  <div 
                    key={t.tier} 
                    className={`price-card ${t.recommended ? 'featured' : ''} ${selectedTier?.tier === t.tier ? 'selected' : ''}`}
                    onClick={() => setSelectedTier(t)}
                  >
                    {t.recommended && <div className="recommended-badge">RECOMMENDED</div>}
                    <div className="tier-select-ring">
                       {selectedTier?.tier === t.tier && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17L4 12" /></svg>}
                    </div>
                    <h4 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "15px" }}>{t.label}</h4>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#FF3C00", marginBottom: "20px" }}>{t.price}</div>
                    <p style={{ color: "#6B6763", fontSize: "0.95rem" }}>Perfect for businesses looking for flexible billing and high-quality results.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STICKY ORDER BAR */}
        <div 
          id="ds-place-order-bar" 
          style={{ 
            position: "fixed", 
            bottom: "0", 
            left: "0", 
            width: "100%", 
            background: "rgba(255, 255, 255, 0.95)", 
            backdropFilter: "blur(10px)", 
            padding: "15px 40px", 
            borderTop: "2px solid #FF3C00", 
            zIndex: 1000,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
            transform: "translateY(0)",
            transition: "all 0.3s ease"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span id="ds-order-label" style={{ fontSize: "0.8rem", fontWeight: 800, color: "#FF3C00", textTransform: "uppercase" }}>{selectedTier ? "SELECTED PLAN" : "CHOOSE A PLAN"}</span>
            <span id="ds-order-plan-text" style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>
              {selectedTier 
                ? `${SERVICE_NAME_MAP[activeService]}  ·  ${selectedTier.label} – ${selectedTier.price}`
                : `${SERVICE_NAME_MAP[activeService]}  ·  (Please select a billing model)`
              }
            </span>
          </div>
          <button 
            id="ds-place-order-btn" 
            onClick={handlePlaceOrder}
            className="submit-btn" 
            style={{ margin: 0, padding: "12px 40px" }}
          >
            <span>PLACE ORDER</span>
          </button>
        </div>

        {/* HOW WE WORK */}
        <section className="ai-process" style={{ padding: "120px 20px", background: "#EEE9E3" }}>
            <div className="container">
                <div style={{ textAlign: "center", marginBottom: "80px" }}>
                    <h2 style={{ fontSize: "3.5rem", fontWeight: 800 }}>🧩 How We Work</h2>
                    <p style={{ color: "#6B6763", fontSize: "1.2rem" }}>Simple. Strategic. Effective.</p>
                </div>

                <div className="process-steps" style={{ position: "relative" }}>
                    <div className="process-line" style={{ position: "absolute", left: "40px", top: 0, bottom: 0, width: "2px", background: "#FF3C00", opacity: 0.2 }}></div>
                    <div className="step" style={{ display: "flex", gap: "30px", marginBottom: "60px", position: "relative" }}>
                        <div className="step-icon" style={{ zIndex: 2, background: "#FF3C00", color: "#fff", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}><i className="fa-solid fa-magnifying-glass"></i></div>
                        <div className="step-content">
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Discover & Plan</h3>
                            <p style={{ color: "#6B6763", fontSize: "1.1rem" }}>We understand your business, goals, and audience. We research your competitors and identify your unique value proposition.</p>
                        </div>
                    </div>
                    <div className="step" style={{ display: "flex", gap: "30px", marginBottom: "60px", position: "relative" }}>
                        <div className="step-icon" style={{ zIndex: 2, background: "#FF3C00", color: "#fff", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}><i className="fa-solid fa-lightbulb"></i></div>
                        <div className="step-content">
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Design & Build</h3>
                            <p style={{ color: "#6B6763", fontSize: "1.1rem" }}>We craft digital products that are functional and scalable. Our engineers and designers work hand-in-hand to deliver excellence.</p>
                        </div>
                    </div>
                    <div className="step" style={{ display: "flex", gap: "30px", marginBottom: "60px", position: "relative" }}>
                        <div className="step-icon" style={{ zIndex: 2, background: "#FF3C00", color: "#fff", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}><i className="fa-solid fa-cogs"></i></div>
                        <div className="step-content">
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Launch & Optimize</h3>
                            <p style={{ color: "#6B6763", fontSize: "1.1rem" }}>We deploy, test, refine, and improve continuously. Post-launch support and analytics-driven optimizations are our specialty.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="cta-section" style={{ padding: "120px 20px", background: "#ffffff" }}>
           <div className="container" style={{ textAlign: "center" }}>
              <h2 className="cta-title">Start Your Project &<br />Book a Consultation</h2>
              <h3 className="cta-subtitle">Click either button below to get started.</h3>
              <div className="cta-actions" style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
                 <Link href="/contact" className="cta-button primary"><span>Book a Call</span></Link>
                 <Link href="/contact" className="cta-button secondary"><span>Get a Quote</span></Link>
              </div>
           </div>
        </section>

        <FloatingContactBtn />
      </main>

      {/* TOAST */}
      {showToast && (
        <div id="ds-toast" className="show" style={{
          position: "fixed",
          top: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1a1a",
          color: "white",
          padding: "16px 32px",
          borderRadius: "100px",
          zIndex: 10000,
          fontWeight: 700,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          border: "2px solid #FF3C00"
        }}>
          {toastMessage}
        </div>
      )}

      <Footer />
    </div>
  );
}
