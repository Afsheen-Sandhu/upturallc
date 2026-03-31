"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LottiePlayer from "@/components/LottiePlayer";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import FloatingContactBtn from "@/components/FloatingContactBtn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const AI_SOLUTIONS = [
  {
    title: "Workflow Automation",
    description: "Replace repetitive manual tasks with intelligent AI workflows that run 24/7 without fatigue.",
    bullets: ["Automated Data Entry", "Smart Email Sorting", "Self-Updating CRMs"],
    outcome: "Reduce manual labor costs by 40%."
  },
  {
    title: "AI Customer Support",
    description: "Deliver instant, 24/7 human-like support that resolves 70% of tickets without needing an agent.",
    bullets: ["Multilingual Chatbots", "Personalized Responses", "Seamless Human Handoff"],
    outcome: "90% faster response times."
  },
  {
    title: "Optimize Human Resources",
    description: "Empower your team to focus on high-level strategy while AI handles the mundane details.",
    bullets: ["Smart Scheduling", "Automated Reporting", "Talent Matching"],
    outcome: "30% increase in team output."
  },
  {
    title: "Increase Efficiency",
    description: "Scale your output without increasing your headcount. AI multiplies your team's capability.",
    bullets: ["Resource Forecasting", "Bottleneck Detection", "Process Optimization"],
    outcome: "Double operational throughput."
  },
  {
    title: "Cut Operational Costs",
    description: "Drastically reduce overhead by automating processes that previously required manual labor.",
    bullets: ["Reduced Hiring Dependency", "Higher Accuracy", "Long-term Scalability"],
    outcome: "Immediate ROI on overhead."
  },
  {
    title: "Save Time",
    description: "Give your team back hours of their day by automating the tasks they dread most.",
    bullets: ["Instant Report Gen", "Automated Documentation", "Rapid Search & Retrieval"],
    outcome: "40+ hours saved per month."
  }
];

const IMPACT_METRICS = [
  { icon: "💰", label: "Up to 65% reduction in customer support costs" },
  { icon: "⚡", label: "3–5x faster response times" },
  { icon: "⏱️", label: "40+ hours saved per employee per month" },
  { icon: "😊", label: "Improved customer satisfaction scores" },
  { icon: "👥", label: "Lower hiring dependency" },
  { icon: "📈", label: "Increased conversion rates by 25%" },
  { icon: "🚀", label: "Higher ROI from digital channels" },
  { icon: "🎯", label: "Stronger brand engagement across platforms" }
];

const BENEFITS = [
  { icon: "fa-rocket", title: "Startups", text: "Scale operations rapidly without scaling costs" },
  { icon: "fa-cart-shopping", title: "E-Commerce", text: "Automate customer support and order management" },
  { icon: "fa-briefcase", title: "Service Companies", text: "Streamline workflows and client communications" },
  { icon: "fa-headset", title: "Support Teams", text: "Handle high volumes with intelligent automation" },
  { icon: "fa-code", title: "SaaS & Tech", text: "Integrate AI into your product ecosystem" },
  { icon: "fa-building-columns", title: "Fintech & Med", text: "Secure, compliant AI for sensitive industries" }
];

const TIER_DATA = {
  startup: {
    badge: 'STARTUP TIER',
    title: 'AI Chat Support',
    price: '$500–$1,200',
    description: 'Ideal for early-stage startups experimenting with AI, small teams, or pilot projects.',
    services: [
      {
        name: '1–2 AI chatbots to handle basic customer inquiries',
        subs: ['Integration with website or messaging apps', 'FAQ-based automation']
      },
      {
        name: 'Basic AI Voice Agent',
        subs: ['Simple voice assistant for calls', 'Can handle 3–5 common queries']
      }
    ],
    howWorks: ['Quick setup within 1–2 weeks', 'Monthly reporting', 'Scalable updates']
  },
  smb: {
    badge: 'SMB TIER',
    title: 'Growing Business Solutions',
    price: '$1,500–$4,500',
    description: 'Ideal for growing businesses looking to scale AI across support and internal operations.',
    services: [
      {
        name: 'AI Chat Support',
        subs: ['Multiple AI chatbots', 'Handles medium complexity queries', 'Basic personalization']
      },
      {
        name: 'Advanced AI Voice Agents',
        subs: ['Voice automation for customer calls', 'Call routing logic']
      }
    ],
    howWorks: ['Setup within 2–4 weeks', 'Monthly reporting with KPIs', 'Ongoing optimization']
  },
  enterprise: {
    badge: 'ENTERPRISE TIER',
    title: 'Enterprise-Grade AI',
    price: '$5,000+',
    description: 'Ideal for large businesses and global operations needing enterprise-grade AI solutions.',
    services: [
      {
        name: 'AI Chat Support (Multi-Language)',
        subs: ['Enterprise-grade chatbots', 'Complex query handling', 'Context-aware interactions']
      },
      {
        name: 'Full AI Process Automation',
        subs: ['Automates complex workflows', 'Integrates with ERP, CRM']
      }
    ],
    howWorks: ['Onboarding: 4–8 weeks', 'Dedicated account manager', '24/7 support']
  }
};

const TESTIMONIALS = [
  {
    stars: "⭐⭐⭐⭐⭐",
    title: "AI reduced our support cost by nearly half.",
    quote: "We were spending a huge amount on customer support agents. Uptura implemented an AI support system that handles 70% of queries automatically.",
    author: "Operations Manager, E-commerce Brand",
    audio: "https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696cd95248eea26c6c9a71f0_AI%201.mp3"
  },
  {
    stars: "⭐⭐⭐⭐⭐",
    title: "Our team now focuses on growth, not repetitive work.",
    quote: "Most of our day was wasted on manual follow-ups and data entry. AI automation workflows saved us countless hours every week.",
    author: "Founder, SaaS Startup",
    audio: "https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696cd9536389a89a5bb45473_ai%202.mp3"
  },
  {
    stars: "⭐⭐⭐⭐⭐",
    title: "AI runs 24/7 — our business finally scales.",
    quote: "We no longer worry about missed messages or delayed responses. AI handles inquiries instantly, even outside business hours.",
    author: "Director, Service-Based Company",
    audio: "https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696cd953d6206a1f99f44fa0_ai%203.mp3"
  }
];

export default function AIConsultancy() {
  const [currentTier, setCurrentTier] = useState<keyof typeof TIER_DATA>("startup");
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);

  useGSAP(() => {
    const cards = gsap.utils.toArray(".ai-solution-card");
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
      cards.forEach((card: any, index) => {
        gsap.set(card, { zIndex: index + 1 });
        if (index < cards.length - 1) {
          gsap.to(card, {
            scale: 0.9,
            y: -30,
            filter: "blur(10px)",
            opacity: 0.8,
            scrollTrigger: {
              trigger: cards[index + 1] as any,
              start: "top 80%",
              end: "top 12%",
              scrub: true,
            }
          });
        }
      });
    }

    gsap.from(".ai-benefits-item", {
      opacity: 0,
      y: 50,
      scale: 0.9,
      stagger: 0.15,
      duration: 0.8,
      scrollTrigger: {
        trigger: ".ai-benefits-grid",
        start: "top 85%",
      }
    });

    gsap.from(".results-card", {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.6,
      scrollTrigger: {
        trigger: ".results-cards",
        start: "top 80%",
      }
    });
  }, { scope: containerRef });

  useEffect(() => {
    const interval = setInterval(() => {
      if (playingAudio === null) {
        setCurrentSlide((prev) => (prev + 1) % TESTIMONIALS.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [playingAudio]);

  const toggleAudio = (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (playingAudio === index) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio !== null) {
        audioRefs.current[playingAudio]?.pause();
      }
      audio.play();
      setPlayingAudio(index);
    }
  };

  const currentTierData = TIER_DATA[currentTier];

  return (
    <div className="bg-[#EEE9E3]" ref={containerRef}>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="hero ai-consultancy-hero">
          <div className="container">
            <div className="hero-inner">
              <div className="hero-left">
                <div className="about-badge">
                  <span className="badge-dot"></span> AI CONSULTANCY
                </div>
                <h1 className="hero-title">
                  Efficiency Redefined<br />
                  with AI-Driven<br />
                  Workflows
                </h1>
                <Link href="/contact" className="book-call" style={{ marginTop: "60px", gap: "12px" }}>
                  <span className="book-call-text">
                    <span>BOOK A CALL</span>
                    <span>BOOK A CALL</span>
                  </span>
                  <span className="book-call-arrow">
                    <svg viewBox="0 0 16 16" fill="none">
                      <path d="M1 15L15 1M15 1H5M15 1V11" stroke="#ff5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </div>

              <div className="hero-right">
                <LottiePlayer
                  src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696c66d11e51381e05d04847_368bc0e9987f4c01bf0015570bbd60fc.json"
                  className="ai-hero-lottie"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Floating AI Solutions Section (Stacked Cards) */}
        <div className="about-badge centered" style={{ marginTop: "100px" }}>
          <span className="badge-dot"></span> HOW AI HELPS BUSINESSES
        </div>
        <section className="ai-solution-section" style={{ padding: "60px 20px 100px" }}>
          <div className="ai-solutions-container max-w-4xl mx-auto space-y-20">
            {AI_SOLUTIONS.map((solution, i) => (
              <div key={i} className="ai-solution-card sticky top-24 bg-white rounded-3xl p-10 shadow-lg mb-20" style={{ minHeight: "450px" }}>
                <div className="ai-card-content">
                  <div className="badge mb-4">UPTURA AI</div>
                  <h2 className="text-4xl font-extrabold mb-4">{solution.title}</h2>
                  <p className="text-gray-600 mb-6">{solution.description}</p>
                  <ul className="bullet-list space-y-3 mb-10">
                    {solution.bullets.map((bullet, j) => (
                      <li key={j} className="pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-[#FF3C00]">{bullet}</li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <div className="result-tag bg-[#FF3C00] text-white px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">OUTCOME</div>
                    <div className="result-text font-bold text-xl">{solution.outcome}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Impact Section */}
        <section className="results-impact">
          <div className="ai-consultancy-container">
            <div className="results-header">
              <h2>
                Real Impact
                <span>(What Businesses Actually Achieve)</span>
              </h2>
              <p>See the measurable results our AI solutions deliver for companies of all sizes.</p>
            </div>
            <div className="results-cards">
              {IMPACT_METRICS.map((metric, i) => (
                <div key={i} className="results-card">
                  <div className="icon">{metric.icon}</div>
                  <h3>{metric.label}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Who Benefits Most Section */}
        <section className="ai-benefits-section">
          <div className="ai-benefits-wrapper">
            <div className="ai-benefits-header">
              <div className="ai-benefits-badge">Perfect For</div>
              <h2 className="ai-benefits-title">Who Benefits Most?</h2>
            </div>
            <div className="ai-benefits-grid">
              {BENEFITS.map((benefit, i) => (
                <div key={i} className="ai-benefits-item">
                  <div className="ai-benefits-card">
                    <div className="ai-benefits-icon-box">
                      <div className="ai-benefits-icon">
                        <i className={`fa-solid ${benefit.icon}`}></i>
                      </div>
                      <div className="ai-benefits-icon-shadow"></div>
                    </div>
                    <h3 className="ai-benefits-card-title">{benefit.title}</h3>
                    <p className="ai-benefits-card-text">{benefit.text}</p>
                    <div className="ai-benefits-line"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Pricing Section */}
        <section id="pricing-details" style={{ padding: "100px 20px" }}>
          <div className="pricing-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="tier-selector" style={{ display: "flex", gap: "12px", marginBottom: "40px", justifyContent: "center" }}>
              {(Object.keys(TIER_DATA) as Array<keyof typeof TIER_DATA>).map((tier) => (
                <button
                  key={tier}
                  className={`tier-btn ${currentTier === tier ? "active" : ""}`}
                  onClick={() => setCurrentTier(tier)}
                >
                  {tier.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="pricing-card">
              <div className="badge">{currentTierData.badge}</div>
              <div className="title">{currentTierData.title}</div>
              <div className="price">{currentTierData.price} / month</div>
              <p className="description">{currentTierData.description}</p>
              
              <div className="section-title">Included Services</div>
              {currentTierData.services.map((service, i) => (
                <div key={i} className="service-item">
                  <div className="service-item-title">
                    <span className="checkmark">✓</span>
                    <span className="service-name">{service.name}</span>
                  </div>
                  <div className="sub-features">
                    {service.subs.map((sub, j) => (
                      <div key={j} className="sub-feature"><span className="dash">—</span>{sub}</div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="how-it-works">
                <div className="how-title">How it Works</div>
                {currentTierData.howWorks.map((step, i) => (
                  <div key={i} className="how-item"><span className="how-check">✓</span>{step}</div>
                ))}
              </div>

              <Link href={`/contact?category=ai&tier=${currentTier}`} className="cta-btn text-center block" style={{ textDecoration: "none" }}>
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </section>

        {/* Sticky Place Order Bar */}
        <div id="ai-place-order-bar">
          <div className="ds-order-bar-inner">
            <div className="ds-order-summary">
              <div className="ds-order-icon"><i className="fa-solid fa-robot"></i></div>
              <div className="ds-order-details">
                <div className="ds-order-label">SUGGESTED AI PLAN</div>
                <div className="ds-order-plan">{currentTierData.badge.replace(' TIER', '')} – {currentTierData.title}  ·  {currentTierData.price}</div>
              </div>
            </div>
            <Link href={`/contact?category=ai&tier=${currentTier}`} className="ds-order-btn" style={{ textDecoration: "none" }}>
              <i className="fa-solid fa-arrow-right"></i>
              Place Order
            </Link>
          </div>
        </div>

        <div className="section-divider"></div>

        {/* Testimonials Carousel */}
        <section className="ai-testimonials">
          <h2 className="ai-title">Client Testimonials</h2>
          <div className="carousel">
            <div className="viewport">
              <div className="track" style={{ transform: `translateX(-${currentSlide * 100}%)`, transition: "transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)", display: "flex" }}>
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="slide" style={{ minWidth: "100%" }}>
                    <div className="stars">{t.stars}</div>
                    <h3>{t.title}</h3>
                    <p>{t.quote}</p>
                    <span className="author">— {t.author}</span>
                    <button className={`audio-btn ${playingAudio === i ? 'playing' : ''}`} onClick={() => toggleAudio(i)}>
                      {playingAudio === i ? '⏸ Pause Audio' : '▶ Play Audio'}
                    </button>
                    <audio ref={el => { audioRefs.current[i] = el }} src={t.audio} onEnded={() => setPlayingAudio(null)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dots">
            {TESTIMONIALS.map((_, i) => (
              <div key={i} className={`dot ${currentSlide === i ? 'active' : ''}`} onClick={() => setCurrentSlide(i)}></div>
            ))}
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Final CTA */}
        <section className="final-ai-cta">
          <div className="ai-consultancy-container">
            <div className="final-cta-content">
              <h2 className="final-cta-title">
                Stop Paying Humans for Work<br />
                <span>AI Can Do Better.</span>
              </h2>
              <p className="final-cta-text">
                Book a <strong>Free AI Consultation</strong> & Discover How Much<br />
                Time & Money You Can Save.
              </p>
              <div className="cta-actions">
                <Link href="/contact" className="cta-button primary"><span>Book a Call</span></Link>
                <Link href="#pricing-details" className="cta-button secondary"><span>View Plans</span></Link>
              </div>
            </div>
          </div>
        </section>
        <FloatingContactBtn />
      </main>
      <Footer />
    </div>
  );
}
