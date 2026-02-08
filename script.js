document.addEventListener("DOMContentLoaded", function () {
    // --- MOUSE FOLLOWER (CUBERTO) ---
    const cursor = new MouseFollower({
        container: document.body,
        speed: 0.6,
        skewing: 1,
        size: 15,
        interactiveSelf: true,
        stateDetection: {
            '-pointer': 'a,button',
        }
    });

    // --- LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // --- LOAD DYNAMIC COMPONENTS ---

    // Function to add Global WhatsApp Button
    const addWhatsAppButton = () => {
        if (document.querySelector('.whatsapp-float')) return; // Prevent duplicate

        const whatsappBtn = document.createElement('a');
        whatsappBtn.href = "https://wa.me/14062356305";
        whatsappBtn.className = "whatsapp-float";
        whatsappBtn.target = "_blank";
        whatsappBtn.rel = "noopener noreferrer";
        whatsappBtn.setAttribute('aria-label', 'Chat on WhatsApp');
        whatsappBtn.innerHTML = `
            <svg viewBox="0 0 24 24" class="whatsapp-icon-float">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
            </svg>
        `;
        document.body.appendChild(whatsappBtn);
    };

    // Call it immediately
    addWhatsAppButton();


    // Function to load HTML into a placeholder
    const loadComponent = (url, placeholderId, callback) => {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${url}`);
                return response.text();
            })
            .then(html => {
                const placeholder = document.getElementById(placeholderId);
                if (placeholder) {
                    placeholder.innerHTML = html;
                    if (callback) callback();
                }
            })
            .catch(error => console.error(error));
    };

    // Load Footer and Init Confetti
    loadComponent('footer.html', 'footer-placeholder', () => {
        // --- Footer Girl Scroll Animation ---
        const footerLottie = document.getElementById('footer-girl-lottie');
        if (footerLottie) {
            footerLottie.addEventListener('ready', () => {
                const lottieInstance = footerLottie.getLottie();
                if (typeof ScrollTrigger !== 'undefined' && lottieInstance) {
                    let playhead = { frame: 0 };
                    const targetEndFrame = (lottieInstance.totalFrames || 100) * 0.6;

                    gsap.to(playhead, {
                        frame: targetEndFrame,
                        ease: "none",
                        scrollTrigger: {
                            trigger: ".footer-wrapper",
                            start: "top bottom",
                            end: "bottom bottom",
                            scrub: 1.5
                        },
                        onUpdate: () => {
                            lottieInstance.goToAndStop(playhead.frame, true);
                        }
                    });
                }
            });
        }

        // --- Footer Confetti Effect ---
        const footer = document.querySelector('.footer-wrapper');
        if (footer) {
            // Create canvas only if it doesn't exist
            if (!document.getElementById('footer-confetti')) {
                const canvas = document.createElement('canvas');
                canvas.id = 'footer-confetti';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.pointerEvents = 'none';
                /* zIndex handled by CSS #footer-confetti */
                footer.appendChild(canvas); /* Changed to appendChild to be on top if z-index matches, but CSS will override */

                const ctx = canvas.getContext('2d');
                let width, height;
                let particles = [];

                function resize() {
                    const rect = footer.getBoundingClientRect();
                    width = canvas.width = rect.width;
                    height = canvas.height = rect.height;
                }

                // Initial resize and listener
                resize();
                window.addEventListener('resize', resize);

                class Particle {
                    constructor(x, y) {
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

                    draw() {
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

                function spawnParticles(x, y, count = 3) {
                    for (let i = 0; i < count; i++) {
                        particles.push(new Particle(x, y));
                    }
                }

                // Animation Loop
                function animate() {
                    ctx.clearRect(0, 0, width, height);
                    for (let i = 0; i < particles.length; i++) {
                        particles[i].update();
                        particles[i].draw();
                        if (particles[i].life <= 0) {
                            particles.splice(i, 1);
                            i--;
                        }
                    }
                    requestAnimationFrame(animate);
                }
                animate();

                // Interactive Events
                footer.addEventListener('mousemove', (e) => {
                    const rect = footer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    spawnParticles(x, y);
                });

                footer.addEventListener('touchstart', (e) => {
                    const rect = footer.getBoundingClientRect();
                    const touch = e.touches[0];
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;
                    spawnParticles(x, y, 5);
                });
            }
        }
    });

    // Load Navbar and Init Navbar Logic
    loadComponent('navbar.html', 'navbar-placeholder', () => {
        const toggle = document.getElementById('nav-toggle');
        const menu = document.getElementById('mobile-menu');
        const navbar = document.querySelector('.custom-navbar');
        const currentPath = window.location.pathname;
        let menuOpen = false;

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Set Active Link
        // Handle root "/" vs "/index.html"
        const isHome = currentPath === '/' || currentPath.endsWith('index.html');

        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (isHome && (href === 'index.html' || href === '/')) {
                // Determine if we need to mark home active? Usually generic site logo is home.
                // But if there is a Home link:
            }

            // Check for exact match or ended with
            if (href && currentPath.endsWith(href)) {
                link.classList.add('active');
            } else if (isHome && href === 'index.html') {
                // link.classList.add('active'); // Optional if you have a Home link
            }
        });

        // Mobile active state
        document.querySelectorAll('.mobile-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.endsWith(href)) {
                link.classList.add('active');
            }
        });


        // 1. Entrance Animation
        gsap.to(".nav-item", {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.7,
            ease: "power3.out",
            delay: 0.2
        });

        // 2. Desktop Hover (Moved to CSS for simpler handling)
        // CSS handles transitions for .nav-fill now.

        // 3. Mobile Dropdown Toggle
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                if (!menuOpen) {
                    toggle.classList.add('active');
                    menu.style.display = 'block';
                    gsap.to(menu, {
                        opacity: 1,
                        y: 0,
                        duration: 0.4,
                        ease: "power3.out"
                    });
                    gsap.to(".mobile-item", {
                        opacity: 1,
                        x: 0,
                        stagger: 0.06,
                        duration: 0.3,
                        delay: 0.1
                    });
                    menuOpen = true;
                } else {
                    toggle.classList.remove('active');
                    gsap.to(menu, {
                        opacity: 0,
                        y: -20,
                        duration: 0.3,
                        ease: "power3.in",
                        onComplete: () => { menu.style.display = 'none'; }
                    });
                    gsap.set(".mobile-item", { opacity: 0, x: -10 });
                    menuOpen = false;
                }
            });

            // 4. Close menu on link click
            document.querySelectorAll('.mobile-link, .mobile-dropdown .cta-button').forEach(link => {
                link.addEventListener('click', () => {
                    if (menuOpen) {
                        toggle.click();
                    }
                });
            });

            // 5. Close menu on outside click
            document.addEventListener('click', (e) => {
                if (menuOpen &&
                    !menu.contains(e.target) &&
                    !toggle.contains(e.target)) {
                    toggle.click();
                }
            });
        }
    });


    // --- SHARED LOGIC (Smooth Scroll) ---
    // Use event delegation for smooth scrolling since nav links might be loaded dynamically
    document.addEventListener('click', function (e) {
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor) {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });

    // --- HOME PAGE SPECIFIC ANIMATIONS ---
    const headline = document.getElementById('uptura-headline');

    // --- HERO TITLE ANIMATION ---
    const words = document.querySelectorAll('.word-wrapper');
    if (words.length > 0) {
        gsap.fromTo(words,
            { y: 100, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                stagger: 0.05,
                ease: "power4.out",
                delay: 0.2
            }
        );

        // Animate the dot separately slightly later
        gsap.fromTo(".hero-title .dot",
            { scale: 0, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                ease: "back.out(1.7)",
                delay: 1.0
            }
        );

        // Animate all inline image widths
        const inlineImages = document.querySelectorAll('.inline-image-wrapper');
        if (inlineImages.length > 0) {
            const targetWidth = window.innerWidth > 768 ? "140px" : "80px";

            gsap.to(inlineImages, {
                width: targetWidth,
                margin: window.innerWidth > 768 ? "0 15px" : "0 8px", // Animate margin as well for smooth reveal
                duration: 1.4,
                ease: "expo.out",
                delay: 0.8,
                stagger: 0.1 // Slight stagger for a premium feel
            });

            // Subtle zoom on images inside
            inlineImages.forEach(wrapper => {
                const img = wrapper.querySelector('img');
                if (img) {
                    gsap.fromTo(img,
                        { scale: 1.5 },
                        {
                            scale: 1,
                            duration: 1.6,
                            ease: "power2.out",
                            delay: 0.8
                        }
                    );
                }
            });
        }
    }

    if (headline) {
        const number = document.getElementById('count-number');
        const popBox = document.getElementById('loop-target');

        // 1. Entrance Reveal
        gsap.to(headline, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power4.out",
            scrollTrigger: {
                trigger: headline,
                start: "top 85%"
            }
        });

        if (number) {
            const targetVal = parseInt(number.getAttribute('data-target'));
            // 2. Number Counting
            gsap.fromTo(number,
                { innerText: 0 },
                {
                    innerText: targetVal,
                    duration: 2.5,
                    snap: { innerText: 1 },
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: headline,
                        start: "top 85%",
                        once: true
                    }
                }
            );
        }

        if (popBox) {
            // 3. Infinite Looping Pop
            gsap.to(popBox, {
                scale: 1.1,
                duration: 1,
                ease: "power1.inOut",
                repeat: -1,
                yoyo: true
            });
        }
    }

    // --- ACCORDION LOGIC ---
    const accordionItems = document.querySelectorAll('.accordion-item');
    if (accordionItems.length > 0) {
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            const content = item.querySelector('.accordion-content');

            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all other items
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        const otherContent = otherItem.querySelector('.accordion-content');
                        gsap.to(otherContent, {
                            height: 0,
                            opacity: 0,
                            duration: 0.4,
                            ease: "power2.out"
                        });
                    }
                });

                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                    gsap.to(content, {
                        height: "auto",
                        opacity: 1,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                } else {
                    item.classList.remove('active');
                    gsap.to(content, {
                        height: 0,
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.in"
                    });
                }
            });
        });
    }

    // --- TESTIMONIALS CAROUSEL LOGIC ---
    const track = document.querySelector(".testimonial-track");
    if (track) {
        const testimonialSlides = document.querySelectorAll(".testimonial-slide");
        const dotsContainer = document.querySelector(".testimonial-dots");
        let testimonialIndex = 0;

        // Create dot indicators
        if (dotsContainer) {
            testimonialSlides.forEach((_, i) => {
                const dot = document.createElement("div");
                dot.classList.add("testimonial-dot");
                if (i === 0) dot.classList.add("active");
                dot.addEventListener("click", () => goToTestimonial(i));
                dotsContainer.appendChild(dot);
            });
        }

        const testimonialDots = document.querySelectorAll(".testimonial-dot");

        function updateTestimonialDots() {
            testimonialDots.forEach(d => d.classList.remove("active"));
            if (testimonialDots[testimonialIndex]) testimonialDots[testimonialIndex].classList.add("active");
        }

        function goToTestimonial(i) {
            testimonialIndex = i;
            gsap.to(track, {
                x: -testimonialIndex * 100 + "%",
                duration: 0.8,
                ease: "power3.inOut"
            });
            updateTestimonialDots();
        }

        // Audio playback
        document.querySelectorAll(".testimonial-audio-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const audio = document.getElementById(btn.dataset.audio);
                if (!audio) return;

                document.querySelectorAll("audio").forEach(a => {
                    if (a !== audio) {
                        a.pause();
                        a.currentTime = 0;
                        const otherBtn = document.querySelector(`[data-audio="${a.id}"]`);
                        if (otherBtn) otherBtn.textContent = "▶ Play Audio";
                    }
                });

                if (audio.paused) {
                    audio.play();
                    btn.textContent = "⏸ Pause Audio";
                } else {
                    audio.pause();
                    btn.textContent = "▶ Play Audio";
                }
            });
        });

        // Reset button text when audio ends
        document.querySelectorAll("audio").forEach(audio => {
            audio.addEventListener("ended", () => {
                const btn = document.querySelector(`[data-audio="${audio.id}"]`);
                if (btn) btn.textContent = "▶ Play Audio";
            });
        });

        // Auto-advance carousel
        let testimonialHovered = false;
        let audioPlaying = false;
        let testimonialAutoplay;

        function startTestimonialAutoplay() {
            testimonialAutoplay = setInterval(() => {
                if (!testimonialHovered && !audioPlaying) {
                    if (testimonialIndex < testimonialSlides.length - 1) {
                        goToTestimonial(testimonialIndex + 1);
                    } else {
                        goToTestimonial(0);
                    }
                }
            }, 5000);
        }

        const carouselElement = document.querySelector(".testimonial-carousel");
        if (carouselElement) {
            carouselElement.addEventListener("mouseenter", () => { testimonialHovered = true; });
            carouselElement.addEventListener("mouseleave", () => { testimonialHovered = false; });

            // Swipe support
            let testimonialStartX = 0;
            let testimonialEndX = 0;

            carouselElement.addEventListener('touchstart', (e) => {
                testimonialStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            carouselElement.addEventListener('touchend', (e) => {
                testimonialEndX = e.changedTouches[0].screenX;
                if (testimonialEndX < testimonialStartX - 50) {
                    if (testimonialIndex < testimonialSlides.length - 1) goToTestimonial(testimonialIndex + 1);
                }
                if (testimonialEndX > testimonialStartX + 50) {
                    if (testimonialIndex > 0) goToTestimonial(testimonialIndex - 1);
                }
            }, { passive: true });
        }

        document.querySelectorAll("audio").forEach(audio => {
            audio.addEventListener("play", () => { audioPlaying = true; });
            audio.addEventListener("pause", () => { audioPlaying = false; });
            audio.addEventListener("ended", () => { audioPlaying = false; });
        });

        startTestimonialAutoplay();
    }

    // --- GRID CARDS ANIMATION ---
    const gridCards = gsap.utils.toArray(".card-item");
    if (gridCards.length > 0 && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(gridCards,
            {
                y: 60,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".card-container",
                    start: "top 80%", // slightly earlier
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    // --- FLOATING CTA BUTTON LOGIC ---
    const ctaSection = document.querySelector('.cta-section');
    const floatingBtn = document.querySelector('.floating-btn');

    if (ctaSection && floatingBtn) {
        gsap.set(floatingBtn, { xPercent: -50, yPercent: -50, scale: 0 });

        let mouseX = 0, mouseY = 0;
        let isBtnHovered = false;

        const checkOverlap = () => {
            const btnX = gsap.getProperty(floatingBtn, "x");
            const btnY = gsap.getProperty(floatingBtn, "y");
            const dx = mouseX - btnX;
            const dy = mouseY - btnY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 40) {
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

        ctaSection.addEventListener("mouseenter", () => {
            gsap.to(floatingBtn, { scale: 1, duration: 0.8, ease: "power2.out" });
            gsap.ticker.add(checkOverlap);
        });

        ctaSection.addEventListener("mouseleave", () => {
            gsap.to(floatingBtn, { scale: 0, duration: 0.3, ease: "power2.in" });
            gsap.ticker.remove(checkOverlap);
            gsap.to(floatingBtn, { backgroundColor: "#FF3C00", color: "#ffffff", duration: 0.3 });
            isBtnHovered = false;
        });

        ctaSection.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            gsap.to(floatingBtn, {
                x: mouseX,
                y: mouseY,
                duration: 1.2,
                ease: "power2.out"
            });
        });
    }

    // --- SERVICES GRID ANIMATIONS ---
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Animate cards on scroll with stagger effect
        gsap.utils.toArray('.service-card').forEach((card, index) => {
            gsap.to(card, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: index * 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        });

        // Animate feature items on hover
        document.querySelectorAll('.service-card').forEach(card => {
            const features = card.querySelectorAll('.feature-item');

            card.addEventListener('mouseenter', () => {
                gsap.to(features, {
                    x: 8,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power2.out"
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(features, {
                    x: 0,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power2.out"
                });
            });
        });
    }

    // --- AI PROCESS ANIMATIONS ---
    const steps = gsap.utils.toArray(".step");
    if (steps.length > 0) {
        steps.forEach((step, index) => {
            gsap.fromTo(step,
                {
                    opacity: 0,
                    y: 40,
                    x: -10
                },
                {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: step,
                        start: "top 88%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }
    // --- SECTION DIVIDER ANIMATION ---
    gsap.utils.toArray(".section-divider").forEach((divider) => {
        gsap.to(divider, {
            width: "80%",
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: divider,
                start: "top 90%",
                toggleActions: "play none none none"
            }
        });
    });

    // --- WHAT WE DO SECTION ANIMATIONS ---
    const whatWeDoSection = document.querySelector(".what-we-do");
    if (whatWeDoSection && typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".what-we-do",
                start: "top 75%"
            }
        });

        tl.to(".what-eyebrow", {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out"
        })
            .to(".what-heading", {
                opacity: 1,
                duration: 0.6,
                ease: "power2.out"
            }, "-=0.3")
            .to(".strike::after", {
                scaleX: 1,
                duration: 0.5,
                ease: "power3.out",
                stagger: 0.15
            })
            .to(".what-main", {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out"
            }, "-=0.2")
            .to(".what-divider", {
                width: "60%",
                duration: 0.8,
                ease: "power2.out"
            })
            .to(".what-sub", {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out"
            }, "-=0.3");
    }
    // --- PRICING SECTION LOGIC ---
    const serviceButtons = document.querySelectorAll('.service-btn');
    const tableMap = {
        web: document.getElementById('web-table'),
        redesign: document.getElementById('redesign-table'),
        social: document.getElementById('social-table'),
        seo: document.getElementById('seo-table'),
        app: document.getElementById('app-table')
    };

    if (serviceButtons.length > 0) {
        serviceButtons.forEach(button => {
            button.addEventListener('click', () => {
                serviceButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                Object.values(tableMap).forEach(table => {
                    if (table) table.classList.add('hidden');
                });

                const service = button.getAttribute('data-service');
                const selectedTable = tableMap[service];
                if (selectedTable) {
                    selectedTable.classList.remove('hidden');
                    gsap.fromTo(selectedTable,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
                    );
                }
            });
        });
    }

    // --- PRICING PROCESS ANIMATIONS ---
    const combinedSection = document.querySelector(".combined-section");
    if (combinedSection && typeof gsap !== 'undefined') {
        gsap.fromTo(combinedSection,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: combinedSection,
                    start: "top 80%"
                }
            }
        );

        gsap.utils.toArray(".step-item, .philosophy-item").forEach((item, index) => {
            gsap.fromTo(item,
                { opacity: 0, x: -20 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.6,
                    ease: "power3.out",
                    delay: index * 0.08,
                    scrollTrigger: {
                        trigger: item,
                        start: "top 95%"
                    }
                }
            );
        });
    }
    // --- HOW WE WORK (AI PROCESS) ANIMATIONS ---
    gsap.utils.toArray(".ai-process .step").forEach((step, index) => {
        gsap.fromTo(step,
            { opacity: 0, y: 50, x: -20 },
            {
                opacity: 1,
                y: 0,
                x: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: step,
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                delay: index * 0.1
            }
        );
    });

    // Connecting line animation
    const processSteps = document.querySelector(".process-line");
    if (processSteps) {
        gsap.fromTo(".process-line",
            { scaleY: 0, transformOrigin: "top" },
            {
                scaleY: 1,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".process-steps",
                    start: "top 80%",
                    toggleActions: "play none none none"
                }
            }
        );
    }

    // --- IMPACT SECTION ANIMATIONS ---
    const impactCards = document.querySelector(".impact-grid");
    if (impactCards) {
        gsap.fromTo(".impact-card",
            { opacity: 0, scale: 0.92, filter: "blur(6px)" },
            {
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.12,
                scrollTrigger: {
                    trigger: ".impact-grid",
                    start: "top 80%"
                }
            }
        );
    }
    // --- AUDIENCE SECTION ANIMATIONS ---
    const audienceSection = document.querySelector(".audience-section");
    if (audienceSection) {
        gsap.to(".audience-pill", {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
                trigger: ".audience-pills",
                start: "top 80%"
            }
        });

        gsap.to(".audience-highlight", {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".audience-highlight",
                start: "top 85%"
            }
        });
    }
});
