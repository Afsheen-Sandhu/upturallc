"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";

export default function FloatingContactBtn() {
    const btnRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const ctaSection = document.querySelector('.cta-section');
        if (!ctaSection || !btnRef.current) return;

        const floatingBtn = btnRef.current;
        gsap.set(floatingBtn, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });

        let mouseX = 0, mouseY = 0;
        let isBtnHovered = false;

        const checkOverlap = () => {
            const btnX = gsap.getProperty(floatingBtn, "x") as number;
            const btnY = gsap.getProperty(floatingBtn, "y") as number;
            const dx = mouseX - btnX;
            const dy = mouseY - btnY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 60) {
                if (!isBtnHovered) {
                    isBtnHovered = true;
                    gsap.to(floatingBtn, { backgroundColor: "#ffffff", color: "#FF3C00", duration: 0.3 });
                }
            } else {
                if (isBtnHovered) {
                    isBtnHovered = false;
                    gsap.to(floatingBtn, { backgroundColor: "#FF3C00", color: "#ffffff", duration: 0.3 });
                }
            }
        };

        const onMouseEnter = () => {
            setIsVisible(true);
            gsap.to(floatingBtn, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" });
            gsap.ticker.add(checkOverlap);
        };

        const onMouseLeave = () => {
            setIsVisible(false);
            gsap.to(floatingBtn, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
            gsap.ticker.remove(checkOverlap);
            gsap.to(floatingBtn, { backgroundColor: "#FF3C00", color: "#ffffff", duration: 0.3 });
            isBtnHovered = false;
        };

        const onMouseMove = (e: any) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            gsap.to(floatingBtn, {
                x: mouseX,
                y: mouseY,
                duration: 1,
                ease: "power2.out"
            });
        };

        ctaSection.addEventListener("mouseenter", onMouseEnter);
        ctaSection.addEventListener("mouseleave", onMouseLeave);
        ctaSection.addEventListener("mousemove", onMouseMove);

        return () => {
            ctaSection.removeEventListener("mouseenter", onMouseEnter);
            ctaSection.removeEventListener("mouseleave", onMouseLeave);
            ctaSection.removeEventListener("mousemove", onMouseMove);
            gsap.ticker.remove(checkOverlap);
        };
    }, []);

    return (
        <Link href="/contact" style={{ display: isVisible ? "block" : "none" }}>
            <div 
                ref={btnRef} 
                className="floating-btn"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 9999,
                    pointerEvents: "none", // To not block mousemove on ctaSection
                    backgroundColor: "#FF3C00",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "30px",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    boxShadow: "0 10px 30px rgba(255, 60, 0, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap"
                }}
            >
                Contact Us
            </div>
        </Link>
    );
}
