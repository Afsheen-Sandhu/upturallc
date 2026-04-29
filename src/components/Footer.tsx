"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import NeuralFlux from "./NeuralFlux";

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!footerRef.current || !canvasRef.current) return;

    const footer = footerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;
    let particles: any[] = [];

    const resize = () => {
      const rect = footer.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };

    resize();
    window.addEventListener('resize', resize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      life: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 + 1;
        this.color = ['#FF3C00', '#ffffff', '#e0e0e0', '#FF5722'][Math.floor(Math.random() * 4)];
        this.life = 100;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        this.size *= 0.96;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath();
        if (Math.random() > 0.5) {
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        } else {
          ctx.fillRect(this.x, this.y, this.size, this.size);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const spawnParticles = (x: number, y: number, count = 3) => {
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
          i--;
        }
      }
      requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = footer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnParticles(x, y);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const rect = footer.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      spawnParticles(x, y, 5);
    };

    footer.addEventListener('mousemove', handleMouseMove);
    footer.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('resize', resize);
      footer.removeEventListener('mousemove', handleMouseMove);
      footer.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <footer ref={footerRef} id="footer-placeholder" className="footer-wrapper">
      <canvas 
        ref={canvasRef} 
        id="footer-confetti" 
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          pointerEvents: "none", 
          zIndex: 99 
        }} 
      />
      <div className="footer-card">
          <div className="footer-top">
              <div className="footer-left-top">
                  <div className="footer-about-container">
                      <p className="footer-about-text">
                          Uptura is a premier agency for AI innovation and strategic design.
                      </p>
                  </div>
                  <Link href="/contact" className="footer-cta-btn"><span>Get Started Today</span></Link>
              </div>
              <div className="footer-center"
                  style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "180px" }}>
                  <NeuralFlux />
              </div>
              <div className="footer-contact-info">
                  <div className="contact-item">
                      <div className="contact-icon">
                          <i className="fa-solid fa-phone"></i>
                      </div>
                      <span>+1 406-235-6305</span>
                  </div>
                  <div className="contact-item">
                      <div className="contact-icon">
                          <i className="fa-solid fa-envelope"></i>
                      </div>
                      <span>info@uptura.net</span>
                  </div>
                  <div className="contact-item">
                      <div className="contact-icon">
                          <i className="fa-solid fa-location-dot"></i>
                      </div>
                      <span>
                          1001 S. Main Street,<br/>
                          Kalispell, MT 59901
                      </span>
                  </div>
              </div>
          </div>

          <div className="footer-bottom-row">
              <div className="footer-logo-container">
                  <Image src="/images/logo-main.png"
                      alt="Uptura" className="footer-logo-large" width={220} height={74} />
                  <div className="copyright-text-bottom">&copy;Uptura 2026</div>
              </div>

              <div className="footer-right-bottom">
                  <div className="office-hours">
                      <span className="hours-label">Mo—Fr</span>
                      <div className="hours-time">9am—6pm EST</div>
                  </div>
                  <div className="social-icons">
                      <a href="https://www.facebook.com/profile.php?id=61586665799485" className="social-icon-btn"
                          aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                          <i className="fa-brands fa-facebook-f"></i>
                      </a>

                      <a href="https://wa.me/14062356305" target="_blank" rel="noopener noreferrer" className="social-icon-btn"
                          aria-label="WhatsApp">
                          <i className="fa-brands fa-whatsapp"></i>
                      </a>

                      <a href="https://www.linkedin.com/company/upturallc/?viewAsMember=true" className="social-icon-btn"
                          aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                          <i className="fa-brands fa-linkedin-in"></i>
                      </a>

                      <a href="https://www.instagram.com/uptura_?igsh=MTl1MWtjdnQxM2pqbQ==" className="social-icon-btn"
                          aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                          <i className="fa-brands fa-instagram"></i>
                      </a>
                  </div>
              </div>
          </div>
      </div>

      <a href="https://wa.me/14062356305" className="whatsapp-float" target="_blank" rel="noopener noreferrer"
          aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" className="whatsapp-icon-float">
              <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z">
              </path>
          </svg>
      </a>
    </footer>
  );
}
