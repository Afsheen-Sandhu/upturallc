"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LottiePlayer from "@/components/LottiePlayer";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import FloatingContactBtn from "@/components/FloatingContactBtn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ServiceKey = "web" | "redesign" | "social" | "seo" | "app";

interface PricingTier {
  tier: string;
  label: string;
  price: string;
  recommended?: boolean;
  bestFor: string;
  deliverables: string;
  timeline: string;
  support: string;
}

const PRICING_DATA: Record<ServiceKey, { title: string; tiers: PricingTier[]; helper: string }> = {
  web: {
    title: "Web Development Pricing",
    helper: "💡 Best for custom functionality and strong online presence.",
    tiers: [
      { tier: "hourly", label: "⏱ Hourly", price: "$30–$40/hr", bestFor: "Updates & fixes", deliverables: "Bug fixes", timeline: "On-demand", support: "Pay-as-you-go" },
      { tier: "project", label: "📦 Project-Based", price: "$1,200–$3,500+", recommended: true, bestFor: "Full builds", deliverables: "Full Launch", timeline: "4–8 weeks", support: "30-day support" },
      { tier: "monthly", label: "🔁 Monthly", price: "Custom", bestFor: "Continuous dev", deliverables: "Ongoing Growth", timeline: "Rolling", support: "Priority" },
    ]
  },
  redesign: {
    title: "Website Redesign Pricing",
    helper: "💡 Perfect for modernizing outdated websites.",
    tiers: [
      { tier: "hourly", label: "⏱ Hourly", price: "$25–$35/hr", bestFor: "Minor improvements", deliverables: "Quick fixes", timeline: "As needed", support: "Limited" },
      { tier: "project", label: "📦 Project-Based", price: "$700–$2,000+", recommended: true, bestFor: "Full redesign", deliverables: "New site", timeline: "2–4 weeks", support: "30 days" },
      { tier: "monthly", label: "🔁 Monthly", price: "Custom", bestFor: "CRO & UX growth", deliverables: "Ongoing Growth", timeline: "Monthly", support: "Priority" },
    ]
  },
  social: {
    title: "Social Media Marketing Pricing",
    helper: "💡 Build your brand presence consistently.",
    tiers: [
      { tier: "hourly", label: "⏱ Hourly", price: "$25–$35/hr", bestFor: "Consulting", deliverables: "Strategy", timeline: "As needed", support: "Limited" },
      { tier: "monthly", label: "🔁 Monthly Retainer", price: "$400–$1,200/mo", recommended: true, bestFor: "Consistent growth", deliverables: "Content + Ads", timeline: "Monthly cycle", support: "Priority" },
      { tier: "campaign", label: "📦 Campaign-Based", price: "Custom", bestFor: "Launches", deliverables: "Campaign", timeline: "Fixed", support: "Included" },
    ]
  },
  seo: {
    title: "SEO Services Pricing",
    helper: "💡 Long-term growth through organic traffic.",
    tiers: [
      { tier: "hourly", label: "⏱ Hourly", price: "$25–$40/hr", bestFor: "Audits", deliverables: "Audit report", timeline: "Short-term", support: "Limited" },
      { tier: "monthly", label: "🔁 Monthly Retainer", price: "$300–$1,000/mo", recommended: true, bestFor: "Long-term growth", deliverables: "Rankings", timeline: "Monthly", support: "Priority" },
      { tier: "sprint", label: "📦 SEO Sprint", price: "Custom", bestFor: "Quick wins", deliverables: "Fast results", timeline: "2–4 weeks", support: "Included" },
    ]
  },
  app: {
    title: "App Development Pricing",
    helper: "💡 From idea to fully launched application.",
    tiers: [
      { tier: "hourly", label: "⏱ Hourly", price: "$30–$45/hr", bestFor: "Fixes", deliverables: "Bug fixes", timeline: "As needed", support: "Limited" },
      { tier: "project", label: "📦 Project-Based", price: "$3,000–$12,000+", recommended: true, bestFor: "Full app builds", deliverables: "Full App", timeline: "6–12 weeks", support: "30-day support" },
      { tier: "monthly", label: "🔁 Monthly", price: "Custom", bestFor: "Continuous Dev", deliverables: "Ongoing Growth", timeline: "Ongoing", support: "Priority" },
    ]
  }
};

const SERVICE_BUTTONS: { key: ServiceKey; label: string }[] = [
  { key: "web", label: "🌐 Custom Web Development" },
  { key: "redesign", label: "🔄 Website Redesign" },
  { key: "social", label: "📣 Social Media" },
  { key: "seo", label: "🔍 SEO Services" },
  { key: "app", label: "📱 App Development" },
];

const SERVICE_NAME_MAP: Record<ServiceKey, string> = {
  web: "Custom Web Development",
  redesign: "Website Redesign",
  social: "Social Media Marketing",
  seo: "SEO Services",
  app: "App Development",
};

export default function DigitalSolutions() {
  const [activeService, setActiveService] = useState<ServiceKey>("web");
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const solutionStackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = gsap.utils.toArray(".digital-solution-card") as HTMLElement[];
    cards.forEach((card, index) => {
      if (index === cards.length - 1) return;
      ScrollTrigger.create({
        trigger: card,
        start: "top 120",
        pin: true,
        pinSpacing: false,
        endTrigger: solutionStackRef.current,
        end: "bottom bottom",
        scrub: true,
      });
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, { scope: solutionStackRef });

  const handlePlaceOrder = () => {
    if (!selectedTier) {
      setToastMessage("Please select a tier first ✨");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const params = new URLSearchParams();
    params.set("category", "digital");
    params.set("service", activeService);
    params.set("tier", selectedTier.tier);
    params.set("plan", `${SERVICE_NAME_MAP[activeService]} – ${selectedTier.label}`);
    params.set("price", selectedTier.price);
    window.location.href = "/checkout?" + params.toString();
  };

  const currentData = PRICING_DATA[activeService];

  return (
    <div className="bg-[#EEE9E3]">
      <Navbar />
      <main>

        {/* HERO */}
        <section className="hero digital-hero">
          <div className="container">
            <div className="hero-inner">
              <div className="hero-left">
                <div className="about-badge">
                  <span className="badge-dot"></span> DIGITAL SOLUTIONS
                </div>
                <h1 className="hero-title">
                  Build. Grow.<br />
                  Scale. — All<br />
                  Under One<br />
                  Roof
                </h1>
                <p className="hero-subtext">
                  We&apos;re a full-service digital agency helping businesses design, develop, and market powerful
                  digital products that drive real growth.
                </p>
              </div>
              <div className="hero-right">
                <LottiePlayer
                  src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/69624d9d38e472cb280aeaae_f32c8ef54cd94ca9a4561c30ad980adc.json"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* SOLUTIONS HEADER */}
        <section className="solutions-header" id="ds-services">
          <div className="container">
            <div className="about-badge centered">
              <span className="badge-dot"></span> Digital solutions we offer
            </div>
            <h2 className="solutions-title">
              Ready to unlock these incredible<br />subscription benefits?
            </h2>
          </div>
        </section>

        {/* STACKED SERVICE CARDS */}
        <section className="digital-solutions-stack" ref={solutionStackRef}>
          <div className="digital-solutions-container">

            <div className="digital-solution-card" id="web-dev">
              <div className="card-top">
                <div className="icon-box">
                  <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" /></svg>
                </div>
                <h2>Custom Website Development</h2>
                <p className="intro">Your website is your digital headquarters — it needs to work flawlessly.</p>
                <div className="bullet-wrapper">
                  <ul className="bullet-list">
                    <li>Custom websites tailored to your business goals</li>
                    <li>Fast, secure, and scalable architectures</li>
                    <li>Conversion-focused layouts</li>
                    <li>Mobile-responsive experiences</li>
                  </ul>
                </div>
              </div>
              <div>
                <div className="result-tag">Result</div>
                <div className="result-text">Websites that don&apos;t just look good — they convert.</div>
              </div>
            </div>

            <div className="digital-solution-card" id="web-redesign">
              <div className="card-top">
                <div className="icon-box">
                  <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" /></svg>
                </div>
                <h2>Website Redesign &amp; Revamp</h2>
                <p className="intro">Already have a website but it&apos;s underperforming?</p>
                <div className="bullet-wrapper">
                  <ul className="bullet-list">
                    <li>Modernize outdated designs</li>
                    <li>Improve speed and performance</li>
                    <li>Fix UX and conversion issues</li>
                    <li>Optimize for SEO and mobile</li>
                  </ul>
                </div>
              </div>
              <div>
                <div className="result-tag">Result</div>
                <div className="result-text">Higher engagement, lower bounce rates, better conversions.</div>
              </div>
            </div>

            <div className="digital-solution-card" id="app-dev">
              <div className="card-top">
                <div className="icon-box">
                  <svg viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" /></svg>
                </div>
                <h2>Mobile App Development</h2>
                <p className="intro">Turn your idea into a powerful mobile experience.</p>
                <div className="bullet-wrapper">
                  <ul className="bullet-list">
                    <li>Native &amp; cross-platform apps</li>
                    <li>Android &amp; iOS applications</li>
                    <li>Secure, scalable backends</li>
                    <li>Smooth UI/UX flows</li>
                  </ul>
                </div>
              </div>
              <div>
                <div className="result-tag">Result</div>
                <div className="result-text">Apps users love and businesses can scale with.</div>
              </div>
            </div>

            <div className="digital-solution-card" id="seo-services">
              <div className="card-top">
                <div className="icon-box">
                  <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                </div>
                <h2>Search Engine Optimization</h2>
                <p className="intro">Visibility = growth. If customers can&apos;t find you, you don&apos;t exist.</p>
                <div className="bullet-wrapper">
                  <ul className="bullet-list">
                    <li>On-page &amp; technical SEO</li>
                    <li>Keyword research &amp; strategy</li>
                    <li>Content optimization</li>
                    <li>Local &amp; global SEO</li>
                  </ul>
                </div>
              </div>
              <div>
                <div className="result-tag">Result</div>
                <div className="result-text">Higher rankings, consistent traffic, long-term ROI.</div>
              </div>
            </div>

            <div className="digital-solution-card" id="social-marketing">
              <div className="card-top">
                <div className="icon-box">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V9h2v7zm4 0h-2V7h2v9z" /></svg>
                </div>
                <h2>Social Media Marketing</h2>
                <p className="intro">We help brands turn attention into revenue.</p>
                <div className="bullet-wrapper">
                  <ul className="bullet-list">
                    <li>Content strategy &amp; planning</li>
                    <li>Paid ad campaigns</li>
                    <li>Audience targeting &amp; growth</li>
                    <li>Performance tracking</li>
                  </ul>
                </div>
              </div>
              <div>
                <div className="result-tag">Result</div>
                <div className="result-text">Strong brand presence + measurable results.</div>
              </div>
            </div>

          </div>
        </section>

        {/* LOTTIE DIVIDER */}
        <div className="lottie-divider">
          <LottiePlayer
            src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/6976466d5e233407f3083840_50f930ad0b53434aa3a02b871ba85f7e.json"
            style={{ width: "300px", height: "auto" }}
          />
        </div>

        {/* WHAT WE DO */}
        <section className="what-we-do">
          <div className="what-container">
            <div className="what-eyebrow">🧠 What We Do</div>
            <h2 className="what-heading">
              We don&apos;t just <span className="strike">build websites</span><br />
              or <span className="strike">run ads</span>.
            </h2>
            <p className="what-main">
              We create <span className="highlight">end-to-end digital solutions</span>{" "}
              that help brands <strong>grow</strong>, <strong>convert</strong>, and{" "}
              <strong>scale</strong>.
            </p>
            <div className="what-divider"></div>
            <p className="what-sub">
              From idea to execution — <span>we handle it all.</span>
            </p>
          </div>
        </section>

        {/* WHO WE WORK WITH */}
        <section className="audience-section">
          <div className="audience-container">
            <div className="audience-header">
              <h2>🧠 Who We Work With</h2>
              <p>If you&apos;re serious about growth, we&apos;re built for you.</p>
            </div>
            <div className="audience-layout">
              <div className="audience-pills">
                <div className="audience-pill"><i className="fa-solid fa-rocket"></i> Startups &amp; Scaleups</div>
                <div className="audience-pill"><i className="fa-solid fa-building"></i> Small &amp; Medium Businesses</div>
                <div className="audience-pill"><i className="fa-solid fa-briefcase"></i> Service-Based Companies</div>
                <div className="audience-pill"><i className="fa-solid fa-cart-shopping"></i> E-commerce Brands</div>
                <div className="audience-pill"><i className="fa-solid fa-microchip"></i> Tech &amp; SaaS Businesses</div>
              </div>
              <div className="audience-highlight">
                <h3>Growth-Focused Teams</h3>
                <p>
                  We partner with ambitious businesses that care about performance,
                  scalability, and measurable outcomes — not shortcuts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* PRICING SECTION */}
        <section className="pricing-wrapper" id="pricing-details">
          <div className="pricing-intro">
            <h2>Built Around Your Business Needs</h2>
            <p>Flexible pricing models designed to match your goals, timeline, and scope.</p>
            <div className="trust-badge">&ldquo;Most projects recover their investment within months.&rdquo;</div>
          </div>

          <div className="service-selector-wrapper">
            <div className="selector-label">✨ Select a service</div>
            <div className="service-buttons">
              {SERVICE_BUTTONS.map((btn) => (
                <button
                  key={btn.key}
                  className={`service-btn${activeService === btn.key ? " active" : ""}`}
                  onClick={() => { setActiveService(btn.key); setSelectedTier(null); }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Table + Cards */}
          <div className="pricing-table-container" id={`${activeService}-table`}>
            <h3 className="table-anchor-label">{currentData.title}</h3>
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  {currentData.tiers.map((t) => <th key={t.tier}>{t.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><td>Best For</td>{currentData.tiers.map((t) => <td key={t.tier}>{t.bestFor}</td>)}</tr>
                <tr><td>Pricing</td>{currentData.tiers.map((t) => <td key={t.tier}>{t.price}</td>)}</tr>
                <tr><td>Deliverables</td>{currentData.tiers.map((t) => <td key={t.tier}>{t.deliverables}</td>)}</tr>
                <tr><td>Timeline</td>{currentData.tiers.map((t) => <td key={t.tier}>{t.timeline}</td>)}</tr>
                <tr><td>Support</td>{currentData.tiers.map((t) => <td key={t.tier}>{t.support}</td>)}</tr>
              </tbody>
            </table>

            <div className="pricing-cards">
              {currentData.tiers.map((t) => (
                <div
                  key={t.tier}
                  className={`price-card selectable-tier${t.recommended ? " featured" : ""}${selectedTier?.tier === t.tier ? " selected" : ""}`}
                  onClick={() => setSelectedTier(t)}
                >
                  <div className="tier-select-ring">
                    {selectedTier?.tier === t.tier && <i className="fa-solid fa-check"></i>}
                  </div>
                  {t.recommended && <div className="recommended-badge">RECOMMENDED</div>}
                  <div className="card-header">
                    <div className="card-title">{t.label}</div>
                    <div className="card-price">{t.price}</div>
                  </div>
                  <div className="card-feature"><span className="feature-label">Best For</span><span className="feature-value">{t.bestFor}</span></div>
                  <div className="card-feature"><span className="feature-label">Deliverables</span><span className="feature-value">{t.deliverables}</span></div>
                  <div className="card-feature"><span className="feature-label">Timeline</span><span className="feature-value">{t.timeline}</span></div>
                  <div className="card-feature"><span className="feature-label">Support</span><span className="feature-value">{t.support}</span></div>
                </div>
              ))}
            </div>
            <div className="table-helper">{currentData.helper}</div>
          </div>

          <div className="pricing-footer-cta">
            <h2>Ready to move forward?</h2>
            <div className="cta-buttons">
              <Link href="/contact" className="cta-btn primary" style={{ textDecoration: "none" }}>Book a Strategy Call</Link>
              <Link href="/contact" className="cta-btn secondary" style={{ textDecoration: "none" }}>Get a Custom Quote</Link>
            </div>
            <p>Most clients start with a project-based setup and scale later.</p>
          </div>
        </section>

        {/* STICKY PLACE ORDER BAR */}
        <div id="ds-place-order-bar" style={{ display: "block" }}>
          <div className="ds-order-bar-inner">
            <div className="ds-order-summary">
              <div className="ds-order-icon"><i className="fa-solid fa-cart-shopping"></i></div>
              <div className="ds-order-details">
                <div className="ds-order-label" id="ds-order-label">
                  {selectedTier ? "Selected Plan" : "Suggested Plan"}
                </div>
                <div className="ds-order-plan" id="ds-order-plan-text">
                  {selectedTier
                    ? `${SERVICE_NAME_MAP[activeService]} – ${selectedTier.label} · ${selectedTier.price}`
                    : "—"}
                </div>
              </div>
            </div>
            <button className="ds-order-btn" id="ds-place-order-btn" onClick={handlePlaceOrder}>
              <i className="fa-solid fa-arrow-right"></i>
              Place Order
            </button>
          </div>
        </div>

        {/* PRICING PROCESS */}
        <section className="pricing-process-wrapper">
          <div className="combined-section">
            <div className="section-container">
              <div className="how-pricing-works">
                <h2>How Our Pricing Works</h2>
                <div className="steps-grid">
                  {[
                    { n: 1, title: "Free Discovery Call", text: "We understand your goals and requirements." },
                    { n: 2, title: "Custom Proposal", text: "You receive a tailored pricing plan." },
                    { n: 3, title: "Clear Deliverables", text: "Milestones, timelines, and scope defined." },
                    { n: 4, title: "Execution & Reporting", text: "Transparent updates at every stage." },
                    { n: 5, title: "Scale Anytime", text: "Upgrade, pause, or expand services easily." },
                  ].map((step) => (
                    <div key={step.n} className="step-item">
                      <div className="step-number">{step.n}</div>
                      <div className="step-content">
                        <h4>{step.title}</h4>
                        <p>{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section-container">
              <div className="pricing-philosophy">
                <h2>Our Pricing Philosophy</h2>
                <div className="philosophy-grid">
                  {[
                    { icon: "💎", title: "No Hidden Fees", text: "What you see is what you pay. Period." },
                    { icon: "🔓", title: "No Long-Term Lock-Ins", text: "Flexible agreements that respect your business." },
                    { icon: "📊", title: "Transparent Billing", text: "Clear breakdowns at every stage." },
                    { icon: "🎯", title: "Pay for Value", text: "Invest in results, not guesswork." },
                    { icon: "📈", title: "Growth-Focused Pricing", text: "Pricing should enable success, not limit it." },
                  ].map((item) => (
                    <div key={item.title} className="philosophy-item">
                      <div className="philosophy-icon">{item.icon}</div>
                      <div className="philosophy-content">
                        <h4>{item.title}</h4>
                        <p>{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IMPACT SECTION */}
        <section className="impact-section">
          <div className="impact-container">
            <div className="impact-header">
              <h2>Real Results, Real Impact</h2>
              <p>We focus on impact, not vanity metrics.</p>
            </div>
            <div className="impact-grid">
              <div className="impact-card">
                <span className="impact-icon"><i className="fa-solid fa-arrow-up-right-dots"></i></span>
                <h3>Improved Conversion Rates</h3>
              </div>
              <div className="impact-card">
                <span className="impact-icon"><i className="fa-solid fa-bolt"></i></span>
                <h3>Faster Load Times</h3>
              </div>
              <div className="impact-card">
                <span className="impact-icon"><i className="fa-solid fa-magnifying-glass-chart"></i></span>
                <h3>Increased Organic Traffic</h3>
              </div>
              <div className="impact-card">
                <span className="impact-icon"><i className="fa-solid fa-heart-pulse"></i></span>
                <h3>Stronger Brand Engagement</h3>
              </div>
              <div className="impact-card highlight">
                <span className="impact-icon"><i className="fa-solid fa-chart-line"></i></span>
                <h3>Digital channels deliver higher ROI by enabling targeted outreach</h3>
              </div>
            </div>
          </div>
        </section>

        {/* How We Work Section */}
        <section className="ai-process">
          <div className="container">
            <div className="process-header">
              <h2>🧩 How We Work</h2>
              <p>Simple. Strategic. Effective.</p>
            </div>
            <div className="process-steps">
              <div className="process-line"></div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-magnifying-glass"></i></div>
                <div className="step-content">
                  <h3>Discover &amp; Plan</h3>
                  <p>We understand your business, goals, and audience.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-lightbulb"></i></div>
                <div className="step-content">
                  <h3>Design &amp; Build</h3>
                  <p>We craft digital products that are functional and scalable.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-cogs"></i></div>
                <div className="step-content">
                  <h3>Launch &amp; Optimize</h3>
                  <p>We deploy, test, refine, and improve continuously.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><i className="fa-solid fa-chart-line"></i></div>
                <div className="step-content">
                  <h3>Grow &amp; Scale</h3>
                  <p>Marketing, SEO, automation — we help you expand.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-container-wrap">
            <div className="container cta-content" style={{ textAlign: "center" }}>
              <LottiePlayer
                src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/6976461cc4f6f1932be43d69_5146020a7bf240ee8ce7bcf890c843dd.json"
                style={{ width: "200px", height: "200px", margin: "0 auto" }}
              />
              <h2 className="cta-title">Start Your Project &amp;<br />Book a Consultation</h2>
              <h3 className="cta-subtitle">Click either button below to get started.</h3>
              <div className="cta-actions">
                <Link href="/contact" className="cta-button primary"><span>Book a Call</span></Link>
                <Link href="/contact" className="cta-button secondary"><span>Get a Quote</span></Link>
              </div>
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
          border: "2px solid #FF3C00",
        }}>
          <i className="fa-solid fa-circle-exclamation" style={{ color: "#FF3C00", marginRight: "8px" }}></i>
          {toastMessage}
        </div>
      )}

      <Footer />
    </div>
  );
}
