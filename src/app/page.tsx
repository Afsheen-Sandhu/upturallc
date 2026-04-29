"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import LottiePlayer from "@/components/LottiePlayer";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FloatingContactBtn from "@/components/FloatingContactBtn";
import TestimonialAudioCarousel from "@/components/TestimonialAudioCarousel";

export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  const [activeAccordion, setActiveAccordion] = useState<number>(0);

  useGSAP(() => {
    const words = document.querySelectorAll('.word-wrapper');
    if (words.length > 0) {
      gsap.fromTo(words, 
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.05, ease: "power4.out", delay: 0.2 }
      );
      gsap.fromTo(".hero-title .dot",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)", delay: 1.0 }
      );
      const inlineImages = document.querySelectorAll('.inline-image-wrapper');
      if (inlineImages.length > 0) {
        const targetWidth = window.innerWidth > 768 ? "140px" : "80px";
        gsap.to(inlineImages, {
          width: targetWidth,
          margin: window.innerWidth > 768 ? "0 15px" : "0 8px",
          duration: 1.4,
          ease: "expo.out",
          delay: 0.8,
          stagger: 0.1
        });
        inlineImages.forEach(wrapper => {
          const img = wrapper.querySelector('img');
          if (img) gsap.fromTo(img, { scale: 1.5 }, { scale: 1, duration: 1.6, ease: "power2.out", delay: 0.8 });
        });
      }
    }
    const headline = document.getElementById('uptura-headline');
    if (headline) {
      const number = document.getElementById('count-number');
      const popBox = document.getElementById('loop-target');
      gsap.to(headline, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: { trigger: headline, start: "top 85%" }
      });
      if (number) {
        gsap.fromTo(number, { innerText: 0 }, { 
          innerText: 790, 
          duration: 2.5, 
          snap: { innerText: 1 }, 
          ease: "power2.out",
          scrollTrigger: { trigger: headline, start: "top 85%", once: true }
        });
      }
      if (popBox) gsap.to(popBox, { scale: 1.1, duration: 1, ease: "power1.inOut", repeat: -1, yoyo: true });
    }
  }, { scope: container });

  return (
    <div ref={container} className="bg-[#EEE9E3]">
      <Navbar />
      <main>
          <section className="hero">
              <div className="container">
                  <div className="hero-inner">
                      <div className="hero-left">
                          <div className="hero-lottie-wrapper">
                              <LottiePlayer 
                                src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/69628d883ed4ef480cb3fd43_4300bca15f764e3a87f9e839a8829c6f.json" 
                                className="hero-accent-lottie"
                                style={{ width: "100%", height: "250px" }}
                              />
                          </div>
                          <a href="/contact" className="book-call">
                              <span className="book-call-text">
                                  <span>BOOK A CALL</span>
                                  <span>BOOK A CALL</span>
                              </span>
                              <span className="book-call-arrow">
                                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 15L15 1M15 1H5M15 1V11" stroke="#ff5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                              </span>
                          </a>
                      </div>
                      <div className="hero-right">
                          <h1 className="hero-title" aria-label="Expert Web Development and SEO Services that Drive Business Growth">
                              <span className="word-wrapper">EXPERT</span>
                              <span className="inline-image-wrapper"><Image src="/images/20260121_2323_image-20generation_remix_01kfgwksbyf6wvky6jrt05bs4c.png" alt="Expert Tech Tool" width={140} height={90} /></span>
                              <span className="word-wrapper">WEB</span><br/>
                              <span className="word-wrapper">DEVELOPMENT</span> <span className="word-wrapper">&</span>
                              <span className="word-wrapper">SEO</span> <span className="word-wrapper">SERVICES</span><br/>
                              <span className="word-wrapper">THAT</span> <span className="word-wrapper">DRIVE</span>
                              <span className="inline-image-wrapper"><Image src="/images/20260121_2326_image-20generation_remix_01kfgwtjnke6wvnz2gy4tz6az7-20-1-.png" alt="Growth Icon" width={140} height={90} /></span>
                              <span className="word-wrapper">BUSINESS</span>
                              <span className="word-wrapper">GROWTH</span><span className="dot">.</span>
                          </h1>
                      </div>
                  </div>
              </div>
          </section>
          
          <div className="section-divider"></div>
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
          
          <section className="about-section" id="about">
              <div className="container">
                  <div className="about-grid">
                      <div className="about-left">
                          <div className="about-badge">
                              <span className="badge-dot"></span> ABOUT US
                          </div>
                          <h2 className="headline-container" id="uptura-headline" style={{ opacity: 0, transform: "translateY(30px)" }}>
                              Uptura delivers for
                              <span className="orange-pop-wrap" id="loop-target">
                                  <span id="count-number">790</span>+
                              </span>
                              clients<br/>
                              worldwide.
                          </h2>
                      </div>
                      <div className="about-right">
                          <TestimonialCarousel />
                      </div>
                  </div>
              </div>
          </section>
          
          <div className="section-divider"></div>

          {/* Client Logos Ticker */}
          <section className="section tricker home">
              <div className="tricker-wrapper">
                  <div className="tricker-single-wrap">
                      <img src="/images/fictional-20company-20logo-2001.svg" alt="Logo 01" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2002.svg" alt="Logo 02" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2003.svg" alt="Logo 03" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2004.svg" alt="Logo 04" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2005.svg" alt="Logo 05" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2006.svg" alt="Logo 06" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2007.svg" alt="Logo 07" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                  </div>
                  <div className="tricker-single-wrap">
                      <img src="/images/fictional-20company-20logo-2001.svg" alt="Logo 01" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2002.svg" alt="Logo 02" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2003.svg" alt="Logo 03" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2004.svg" alt="Logo 04" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2005.svg" alt="Logo 05" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2006.svg" alt="Logo 06" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                      <img src="/images/fictional-20company-20logo-2007.svg" alt="Logo 07" className="tricker-single-image" />
                      <div className="tricker-divider"></div>
                  </div>
              </div>
          </section>

          <div className="section-divider"></div>

          {/* Services & Accordion Section */}
          <section className="services-section" id="solutions">
              <div className="container">
                  <div className="services-grid">
                      <div className="services-left">
                          <LottiePlayer
                            src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696a770dd3cf2e9e995b6916_955c4b7cf6534e0cb560a1e8e52bbb34.json"
                            style={{ width: "100%", maxWidth: "550px", height: "auto" }}
                          />
                      </div>
                      <div className="services-right">
                          <div className="about-badge">
                              <span className="badge-dot"></span> OUR DIGITAL SOLUTIONS
                          </div>
                          <div className="accordion">
                              {[
                                  { title: "Custom Web Development", text: "Tailored web development that meets your business goals, ensuring your website is responsive, scalable, and user-friendly." },
                                  { title: "Web Design", text: "Creating visually stunning and intuitive interfaces that engage users and elevate your brand's digital identity through research-backed design." },
                                  { title: "SEO Services", text: "Strategic optimization to increase your search engine visibility, drive organic traffic, and ensure your business reaches its target audience effectively." },
                                  { title: "Mobile App Development", text: "Building high-performance native and cross-platform mobile applications that provide seamless user experiences across all devices and platforms." },
                                  { title: "AI Consultancy", text: "Leveraging cutting-edge artificial intelligence to optimize your business processes, automate workflows, and provide data-driven insights for growth." }
                              ].map((item, i) => (
                                  <div key={i} className={`accordion-item${activeAccordion === i ? ' active' : ''}`} onClick={() => setActiveAccordion(i)}>
                                      <div className="accordion-header">
                                          <h3 className="accordion-title">{item.title}</h3>
                                      </div>
                                      <div className="accordion-content" style={activeAccordion === i ? { height: 'auto', opacity: 1 } : {}}>
                                          <p className="accordion-text">{item.text}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <a href="/digital-solutions" className="explore-services">
                              <span className="book-call-text">
                                  <span>EXPLORE OUR SERVICES</span>
                                  <span>EXPLORE OUR SERVICES</span>
                              </span>
                              <span className="book-call-arrow">
                                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 15L15 1M15 1H5M15 1V11" stroke="#FF3C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                              </span>
                          </a>
                      </div>
                  </div>
              </div>
          </section>

          <div className="section-divider"></div>

          {/* Growth Ticker Section */}
          <section className="growth-ticker">
              <div className="growth-wrapper">
                  <div className="marquee-content">
                      <div className="growth-item">Work Smarter <div className="growth-dot"></div></div>
                      <div className="growth-item">Stronger <div className="growth-dot"></div></div>
                      <div className="growth-item">Build Faster <div className="growth-dot"></div></div>
                      <div className="growth-item">Scale Beyond <div className="growth-dot"></div></div>
                      <div className="growth-item">Grow Together <div className="growth-dot"></div></div>
                  </div>
                  <div className="marquee-content">
                      <div className="growth-item">Work Smarter <div className="growth-dot"></div></div>
                      <div className="growth-item">Stronger <div className="growth-dot"></div></div>
                      <div className="growth-item">Build Faster <div className="growth-dot"></div></div>
                      <div className="growth-item">Scale Beyond <div className="growth-dot"></div></div>
                      <div className="growth-item">Grow Together <div className="growth-dot"></div></div>
                  </div>
              </div>
          </section>

          <div className="section-divider"></div>

          {/* Testimonials Section (Audio Cards Carousel) */}
          <section className="ai-testimonials" style={{ backgroundColor: '#EEE9E3', padding: '120px 0' }}>
              <div className="container" style={{ maxWidth: '1200px' }}>
                  <h2 className="ai-title" style={{ textAlign: 'center', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, marginBottom: '80px', color: '#1a1a1a' }}>Client Testimonials</h2>
                  
                  <TestimonialAudioCarousel />
              </div>
          </section>

          <div className="section-divider"></div>

          {/* Stacked Advantages Section */}
          <section className="stack-section">
              <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="stack-intro" style={{ textAlign: "center", marginBottom: "60px" }}>
                      <div className="badge-dot" style={{ margin: "0 auto 25px", width: "12px", height: "12px", backgroundColor: "#FF3C00", borderRadius: "50%" }}></div>
                      <h2 className="ai-title" style={{ marginBottom: "30px" }}>Ready to unlock<br/>powerful digital advantages?</h2>
                      <div style={{ transform: "rotate(90deg)", width: "250px", height: "250px", margin: "0 auto" }}>
                          <LottiePlayer 
                            src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/695ff1d69348ca85ecc8557a_bouncy_ball.json"
                            style={{ width: "100%", height: "100%" }}
                          />
                      </div>
                  </div>
                  <div className="card-container">
                      {[
                          { title: 'Effortless Collaboration', text: 'Synchronize your team in real-time with shared workspaces that eliminate friction.', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z' },
                          { title: 'Streamlined Execution', text: 'Move from concept to completion with automated workflows designed to handle the heavy lifting.', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z' },
                          { title: 'Elite Creative Squad', text: 'Gain access to a hand-picked group of top-tier designers and strategists dedicated to your brand.', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
                          { title: 'Rapid Delivery Cycles', text: 'Why wait months? Our high-velocity production model delivers premium results in record time.', icon: 'M13 3l-4 7h3v8l4-7h-3l4-7z' },
                          { title: 'Adaptive Pricing', text: 'Scalable pricing that aligns with your goals. No hidden fees, just transparent value.', icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' },
                          { title: 'Future-Proof', text: 'Stay ahead with scalable technologies that grow with your brand\'s ambitions.', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' }
                      ].map((card, i) => (
                          <div key={i} className="card-item">
                              <p>{card.text}</p>
                              <div className="icon-box">
                                  <svg viewBox="0 0 24 24"><path d={card.icon} /></svg>
                              </div>
                              <h2>{card.title}</h2>
                          </div>
                      ))}
                  </div>
              </div>
          </section>

          <div className="section-divider"></div>

          {/* Centered Lottie Divider */}
          <section className="lottie-cta" style={{ padding: "80px 0", backgroundColor: "#EEE9E3", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <LottiePlayer 
                src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/697646a4e64a222537358e7d_5e348676431a4786a8feb19eb1ef90fb.json"
                style={{ width: "350px", height: "350px" }}
              />
          </section>

          <div className="section-divider"></div>

          {/* Featured Works Section */}
          <section className="works-section" id="work">
              <div className="container">
                  <div className="works-grid">
                      <div className="works-col works-left">
                          <div className="works-image-wrap">
                              <Image src="/images/20260122_0004_laptop-20website-20mockup_remix_01kfgyzneyffz8etnczt35ghkr-20-1-.png" alt="Skincare E-commerce Platform" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" />
                          </div>
                          <div className="works-text-part">
                              <h2>- tangible results that help our clients reach their goals.</h2>
                          </div>
                      </div>
                      <div className="works-col works-right">
                          <div className="works-text-part">
                              <div className="works-badge"><span className="badge-dot"></span> FEATURED WORKS</div>
                              <h2>We strive to deliver measurable -</h2>
                          </div>
                          <div className="works-image-wrap">
                              <Image src="/images/20260121_2326_image-20generation_remix_01kfgwtjnke6wvnz2gy4tz6az7-20-1-.png" alt="Luxury Architecture Showcase" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" />
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          <div className="section-divider"></div>
          
          {/* CTA Section */}
          <section className="cta-section">
              <div className="cta-container-wrap">
                  <div className="container cta-content" style={{ textAlign: 'center' }}>
                      <LottiePlayer 
                        src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/6976461cc4f6f1932be43d69_5146020a7bf240ee8ce7bcf890c843dd.json"
                        style={{ width: "200px", height: "200px", margin: "0 auto" }}
                      />
                      <h2 className="cta-title">Just one more step to make<br/>your perfect choice</h2>
                      <h3 className="cta-subtitle">Click either button below to get started.</h3>
                      <div className="cta-actions">
                          <a href="/digital-solutions" className="cta-button primary"><span>Digital Solutions</span></a>
                          <a href="/ai-consultancy" className="cta-button secondary"><span>AI Consulting</span></a>
                      </div>
                  </div>
              </div>
          </section>
      </main>
      <Footer />
      <FloatingContactBtn />
    </div>
  );
}
