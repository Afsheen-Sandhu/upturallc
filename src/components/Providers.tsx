"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";
import MouseFollower from "mouse-follower";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 1. Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // 2. Mouse Follower
    let cursor: any = null;
    if (typeof window !== "undefined") {
      (window as any).gsap = gsap;
      if (MouseFollower && (MouseFollower as any).registerGSAP) {
        (MouseFollower as any).registerGSAP(gsap);
      }
      
      cursor = new (MouseFollower as any)({
        container: document.body,
        speed: 0.7,
        skewing: 1,
        size: 15,
        interactiveSelf: false,
      });
    }

    // 3. Magnetic Buttons logic (Global Hook)
    const initMagnetic = () => {
      const magneticBtns = document.querySelectorAll(
        ".book-call, .cta-button, .hamburger, .explore-services, .footer-cta-btn"
      );

      magneticBtns.forEach((btn) => {
        const btnEl = btn as HTMLElement;
        const text = btnEl.querySelector("span");

        const onMouseMove = (e: MouseEvent) => {
          const rect = btnEl.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;

          gsap.to(btnEl, {
            x: x * 0.35,
            y: y * 0.35,
            duration: 0.4,
            ease: "power3.out",
          });

          if (text) {
            gsap.to(text, {
              x: x * 0.15,
              y: y * 0.15,
              duration: 0.4,
              ease: "power3.out",
            });
          }
        };

        const onMouseLeave = () => {
          gsap.to(btnEl, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "elastic.out(1, 0.4)",
          });

          if (text) {
            gsap.to(text, {
              x: 0,
              y: 0,
              duration: 0.6,
              ease: "elastic.out(1, 0.4)",
            });
          }
        };

        btnEl.addEventListener("mousemove", onMouseMove as any);
        btnEl.addEventListener("mouseleave", onMouseLeave as any);
      });
    };

    initMagnetic();

    return () => {
      lenis.destroy();
      if (cursor) cursor.destroy();
    };
  }, []);

  return <>{children}</>;
}
