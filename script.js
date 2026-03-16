document.addEventListener("DOMContentLoaded", function () {
    const cursor = new MouseFollower({
        container: document.body,
        speed: 0.7,
        skewing: 1,
        size: 15,
        interactiveSelf: false, // Prevents library from adding its own hover states if not wanted
    });

    // --- FLUID MAGNETIC BUTTONS ---
    const magneticBtns = document.querySelectorAll('.book-call, .cta-button, .hamburger, .explore-services, .footer-cta-btn');

    magneticBtns.forEach(btn => {
        const text = btn.querySelector('span'); // Get the internal text for parallax

        btn.addEventListener('mousemove', function (e) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Move the button itself
            gsap.to(btn, {
                x: x * 0.35,
                y: y * 0.35,
                duration: 0.4,
                ease: "power3.out"
            });

            // Move the internal text at a different speed for "fluid" feel
            if (text) {
                gsap.to(text, {
                    x: x * 0.15,
                    y: y * 0.15,
                    duration: 0.4,
                    ease: "power3.out"
                });
            }
        });

        btn.addEventListener('mouseleave', function () {
            // Snap the button back with a fluid elastic effect
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.4)"
            });

            if (text) {
                gsap.to(text, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: "elastic.out(1, 0.4)"
                });
            }
        });
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

    // --- BOOKING MODAL GLOBAL TRIGGER ---
    // This catches all "Book a Call" / "Get Started" clicks globally and prevents navigation to contact.html
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a, button, [class*="book-call"], [class*="cta"]');
        if (!target) return;

        const href = target.getAttribute('href') || '';
        const textContent = target.textContent.trim().toLowerCase();
        const classStr = target.className.toLowerCase();

        // 1. Direct Text check (Highest Priority)
        const isBookingText = textContent.includes('book a call') ||
            textContent.includes('schedule') ||
            textContent.includes('get started') ||
            textContent.includes('get a quote');

        // 2. Class check
        const isCTAClass = classStr.includes('book-call') ||
            classStr.includes('cta-button') ||
            classStr.includes('cta-btn') ||
            classStr.includes('footer-cta-btn');

        // 3. Contact link filter
        // If it's explicitly a "Contact" link in the navigation, we might let it through, 
        // BUT if it says "Book a Call", we always hijack it.
        const isNavLink = classStr.includes('nav-link') || classStr.includes('mobile-link');
        const isContactTextOnly = textContent === 'contact';

        if (isBookingText || (href.includes('contact.html') && !isNavLink) || (href.includes('contact.html') && isCTAClass)) {
            // EXCEPTION 1: If it's just the 'Contact' word in the menu, let it go to contact page
            if (isContactTextOnly && isNavLink) return;

            // EXCEPTION 2: If the button is ALREADY inside the booking modal, do NOT hijack it!
            // This prevents the "Schedule Meeting" submit button from being blocked.
            if (target.closest('.booking-modal-overlay') || target.closest('.booking-modal-card')) return;

            e.preventDefault();
            if (window.openBookingModal) {
                window.openBookingModal(e);
            } else {
                // Modal not loaded yet? Force load it and then open
                initBookingModal();
                // Wait a bit for the load and then try again
                setTimeout(() => window.openBookingModal?.(e), 500);
            }
        }
    });

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
        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) return;

        // If the placeholder is already hardcoded (contains elements), just trigger callback
        if (placeholder.children.length > 0) {
            if (callback) callback();
            return;
        }

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${url}`);
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                if (callback) callback();
            })
            .catch(error => console.error(error));
    };

    // Load Footer and Init Neural Flux
    loadComponent('footer.html', 'footer-placeholder', () => {
        // --- Footer Premium Animation: Neural Flux ---
        const footerContainer = document.getElementById('footer-3d-canvas-container');
        if (footerContainer) {
            if (typeof THREE === 'undefined') {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js";
                script.onload = () => setTimeout(() => initNeuralFlux(footerContainer), 100);
                document.head.appendChild(script);
            } else {
                setTimeout(() => initNeuralFlux(footerContainer), 100);
            }
        }

        function initNeuralFlux(container) {
            let width = container.clientWidth || 400;
            let height = container.clientHeight || 220;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
            camera.position.z = 8.5;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            // 1. Create Neural Field (Particles)
            const particlesCount = 2500;
            const positions = new Float32Array(particlesCount * 3);
            const sizes = new Float32Array(particlesCount);
            const initialPositions = new Float32Array(particlesCount * 3);

            for (let i = 0; i < particlesCount; i++) {
                // Sphere distribution (slightly tighter to avoid edges)
                const r = 2.2 + Math.random() * 0.4;
                const theta = Math.acos(2 * Math.random() - 1);
                const phi = 2 * Math.PI * Math.random();

                const x = r * Math.sin(theta) * Math.cos(phi);
                const y = r * Math.sin(theta) * Math.sin(phi);
                const z = r * Math.cos(theta);

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                initialPositions[i * 3] = x;
                initialPositions[i * 3 + 1] = y;
                initialPositions[i * 3 + 2] = z;

                sizes[i] = Math.random() * 2.5 + 1.2;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const material = new THREE.PointsMaterial({
                color: 0xFF5500,
                size: 0.1,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true
            });

            const points = new THREE.Points(geometry, material);
            scene.add(points);



            // 3. Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const centerLight = new THREE.PointLight(0xFF3C00, 35, 12);
            scene.add(centerLight);

            // 4. Interactivity
            let mouseX = 0, mouseY = 0;
            let targetMouseX = 0, targetMouseY = 0;

            window.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                targetMouseX = ((e.clientX - rect.left) / width) * 2 - 1;
                targetMouseY = -((e.clientY - rect.top) / height) * 2 + 1;
            });

            // 5. Animation Loop
            function animate() {
                requestAnimationFrame(animate);

                const time = Date.now() * 0.0005;

                // Smooth mouse interpolation
                mouseX += (targetMouseX - mouseX) * 0.05;
                mouseY += (targetMouseY - mouseY) * 0.05;

                // Animate Particles (Neural Pulsing)
                const posAttr = points.geometry.attributes.position;
                for (let i = 0; i < particlesCount; i++) {
                    const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

                    // Wave motion
                    const wave = Math.sin(time + initialPositions[ix]) * 0.1;
                    posAttr.array[ix] = initialPositions[ix] + wave + (mouseX * 0.2);
                    posAttr.array[iy] = initialPositions[iy] + Math.cos(time + initialPositions[iy]) * 0.1 + (mouseY * 0.2);
                    posAttr.array[iz] = initialPositions[iz] + Math.sin(time * 0.5) * 0.1;
                }
                posAttr.needsUpdate = true;

                // Rotate Overlays
                points.rotation.y += 0.001;


                // Subtle Scene Tilt
                scene.rotation.x = mouseY * 0.1;
                scene.rotation.y = mouseX * 0.1;

                renderer.render(scene, camera);
            }

            window.addEventListener('resize', () => {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                if (newWidth && newHeight) {
                    camera.aspect = newWidth / newHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(newWidth, newHeight);
                }
            });

            animate();
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

            // Swipe & Drag support
            let testimonialStartX = 0;
            let testimonialIsDragging = false;

            // Touch events
            carouselElement.addEventListener('touchstart', (e) => {
                testimonialStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            carouselElement.addEventListener('touchend', (e) => {
                const testimonialEndX = e.changedTouches[0].screenX;
                handleSwipe(testimonialStartX, testimonialEndX);
            }, { passive: true });

            // Mouse events
            carouselElement.addEventListener('mousedown', (e) => {
                testimonialStartX = e.clientX;
                testimonialIsDragging = true;
                carouselElement.style.cursor = 'grabbing';
            });

            window.addEventListener('mouseup', (e) => {
                if (!testimonialIsDragging) return;
                const testimonialEndX = e.clientX;
                handleSwipe(testimonialStartX, testimonialEndX);
                testimonialIsDragging = false;
                carouselElement.style.cursor = 'grab';
            });

            carouselElement.addEventListener('mouseleave', () => {
                if (testimonialIsDragging) {
                    testimonialIsDragging = false;
                    carouselElement.style.cursor = 'grab';
                }
            });

            function handleSwipe(start, end) {
                const diff = start - end;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        // Dragged left -> Next
                        if (testimonialIndex < testimonialSlides.length - 1) {
                            goToTestimonial(testimonialIndex + 1);
                        } else {
                            goToTestimonial(0); // Optional: loop
                        }
                    } else {
                        // Dragged right -> Prev
                        if (testimonialIndex > 0) {
                            goToTestimonial(testimonialIndex - 1);
                        } else {
                            goToTestimonial(testimonialSlides.length - 1); // Optional: loop
                        }
                    }
                }
            }
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
    const impactCardsElements = gsap.utils.toArray(".impact-card");
    if (impactCardsElements.length > 0) {
        impactCardsElements.forEach((card, index) => {
            gsap.fromTo(card,
                {
                    opacity: 0,
                    scale: 0.92,
                    filter: "none"
                },
                {
                    opacity: 1,
                    scale: 1,
                    filter: "none",
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%"
                    }
                }
            );
        });
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

    // --- TESTIMONIAL VIDEO SWIPER (CARDS EFFECT) ---
    if (document.querySelector('.testimonialSwiper')) {
        const swiper = new Swiper(".testimonialSwiper", {
            effect: "cards",
            grabCursor: true,
            slidesPerView: 1,
            perSlideOffset: 12,
            perSlideRotate: 4,
            rotate: true,
            slideShadows: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            loop: true,
        });

        const swiperContainer = document.querySelector('.testimonialSwiper');
        let isHovered = false;

        const updateAutoplay = () => {
            const isAnyUnmuted = Array.from(document.querySelectorAll('.testimonialSwiper video')).some(v => !v.muted);
            if (isHovered || isAnyUnmuted) {
                swiper.autoplay.stop();
            } else {
                swiper.autoplay.start();
            }
        };

        swiperContainer.addEventListener('mouseenter', () => {
            isHovered = true;
            updateAutoplay();
        });

        swiperContainer.addEventListener('mouseleave', () => {
            isHovered = false;
            updateAutoplay();
        });

        // Handle Mute/Unmute
        const muteBtns = document.querySelectorAll('.video-mute-btn');
        muteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const video = btn.closest('.swiper-slide').querySelector('video');
                const icon = btn.querySelector('i');

                if (video.muted) {
                    // Mute all others first to be safe
                    document.querySelectorAll('.testimonialSwiper video').forEach(v => {
                        v.muted = true;
                        const otherIcon = v.parentElement.querySelector('.video-mute-btn i');
                        if (otherIcon) otherIcon.className = 'fa-solid fa-volume-xmark';
                    });

                    video.muted = false;
                    icon.className = 'fa-solid fa-volume-high';
                    gsap.fromTo(btn, { scale: 1 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
                } else {
                    video.muted = true;
                    icon.className = 'fa-solid fa-volume-xmark';
                }
                updateAutoplay();
            });
        });

        // Auto-mute on slide change and resume autoplay check
        swiper.on('slideChange', () => {
            document.querySelectorAll('.testimonialSwiper video').forEach(v => {
                v.muted = true;
                const btnIcon = v.parentElement.querySelector('.video-mute-btn i');
                if (btnIcon) btnIcon.className = 'fa-solid fa-volume-xmark';
            });
            updateAutoplay();
        });

        // Auto-mute when scrolling out of view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    document.querySelectorAll('.testimonialSwiper video').forEach(v => {
                        v.muted = true;
                        const icon = v.parentElement.querySelector('.video-mute-btn i');
                        if (icon) icon.className = 'fa-solid fa-volume-xmark';
                    });
                    updateAutoplay();
                }
            });
        }, { threshold: 0 });

        observer.observe(swiperContainer);
    }

    // --- PREMIUM CHATBOT LOGIC ---
    function initPremiumChatbot() {
        const chatbotHTML = `
            <div class="chatbot-widget">
                <div class="chatbot-toggle" id="chatbot-toggle">
                    <i class="fa-solid fa-robot"></i>
                </div>
                <div class="chatbot-window" id="chatbot-window">
                    <div class="chatbot-header">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fa-solid fa-robot"></i>
                            <h3>TuraBot</h3>
                        </div>
                        <i class="fa-solid fa-xmark" id="chatbot-close" style="cursor:pointer;"></i>
                    </div>
                    <div class="chatbot-messages" id="chatbot-messages" data-lenis-prevent>
                        <div class="message bot">
                            Hey! I'm TuraBot. 🤖 How can I help you today?
                        </div>
                    </div>
                    <div class="chatbot-input-area">
                        <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Type your message...">
                        <button class="chatbot-send" id="chatbot-send">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);

        // --- HASH-BASED TAB SWITCHING ---
        // Helper to handle URL hash for pricing tabs
        const handleHashTab = () => {
            const hash = window.location.hash;
            if (hash && hash.includes('-table')) {
                const service = hash.replace('#', '').replace('-table', '');
                const btn = document.querySelector(`.service-btn[data-service="${service}"]`);
                if (btn) {
                    btn.click();
                    // Manually scroll to the table after it's unhidden
                    setTimeout(() => {
                        const table = document.getElementById(hash.replace('#', ''));
                        if (table) {
                            table.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 100);
                }
            }
        };

        // Listen for internal hash changes (from bot links)
        window.addEventListener('hashchange', handleHashTab);
        // Also run on load
        setTimeout(handleHashTab, 500);

        const toggle = document.getElementById('chatbot-toggle');
        const chatbotWindow = document.getElementById('chatbot-window');
        const close = document.getElementById('chatbot-close');
        const input = document.getElementById('chatbot-input');
        const send = document.getElementById('chatbot-send');
        const messages = document.getElementById('chatbot-messages');

        let chatHistory = [
            { role: 'assistant', content: "Hey! I'm TuraBot. 🤖 How can I help you today?" }
        ];

        const addMessage = (text, sender) => {
            const msg = document.createElement('div');
            msg.className = `message ${sender}`;

            // Add to internal history for AI context
            chatHistory.push({ role: sender === 'bot' ? 'assistant' : 'user', content: text });
            // Maintain a reasonable history size
            if (chatHistory.length > 20) chatHistory.shift();

            // Handle Action Buttons for Bot (More robust regex)
            if (sender === 'bot') {
                const actionRegex = /```(?:json|ACTION_JSON)?\s*([\s\S]*?)\s*```/;
                const match = text.match(actionRegex);

                if (match && match[1].includes('"actions"')) {
                    try {
                        const actionData = JSON.parse(match[1].trim());
                        const cleanText = text.replace(actionRegex, '').trim();
                        msg.innerHTML = cleanText.replace(/\n/g, '<br>');

                        if (actionData.actions && actionData.actions.length > 0) {
                            const actionContainer = document.createElement('div');
                            actionContainer.className = 'message-actions';

                            actionData.actions.forEach(action => {
                                const btn = document.createElement('a');
                                btn.className = 'btn-action';
                                btn.href = action.url;
                                btn.innerText = action.label;
                                // Only open in new tab if it's an external domain
                                const isExternal = action.url.startsWith('http') &&
                                    !action.url.includes('uptura.net') &&
                                    !action.url.includes('localhost');
                                if (isExternal) {
                                    btn.target = '_blank';
                                }
                                actionContainer.appendChild(btn);
                            });

                            msg.appendChild(actionContainer);
                        }
                    } catch (e) {
                        console.error("Error parsing Action JSON:", e);
                        msg.innerText = text;
                    }
                } else {
                    msg.innerHTML = text.replace(/\n/g, '<br>');
                }
            } else {
                msg.innerText = text;
            }

            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
        };

        // OPENAI CONFIG (Vercel Serverless)
        const getAIResponse = async (userText) => {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userText,
                        history: chatHistory
                    })
                });

                const data = await response.json();
                return data.reply;
            } catch (error) {
                console.error("Fetch Error:", error);
                return "Connection error. Make sure you are running 'vercel dev'!";
            }
        };

        const handleSend = async () => {
            const text = input.value.trim();
            if (!text) return;

            addMessage(text, 'user');
            input.value = '';

            // Loading state
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'message bot';
            loadingMsg.innerText = '...';
            messages.appendChild(loadingMsg);

            const aiResponse = await getAIResponse(text);
            if (messages.contains(loadingMsg)) {
                messages.removeChild(loadingMsg);
            }
            addMessage(aiResponse, 'bot');
        };

        toggle.addEventListener('click', () => chatbotWindow.classList.toggle('active'));
        close.addEventListener('click', () => chatbotWindow.classList.remove('active'));
        send.addEventListener('click', handleSend);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
    }

    initPremiumChatbot();

    // --- BOOKING MODAL LOGIC ---
    function initBookingModal() {
        const placeholderId = 'booking-modal-placeholder';
        loadComponent('booking-modal.html', placeholderId, () => {
            const modal = document.getElementById('bookingModal');
            const closeBtn = document.getElementById('closeBookingModal');
            const form = document.getElementById('bookingForm');
            const successMsg = document.getElementById('bookingSuccess');
            const submitBtn = document.getElementById('bookingSubmitBtn');
            const btnText = submitBtn.querySelector('.booking-btn-text');
            const spinner = document.getElementById('bookingSpinner');

            // Open Modal Function
            window.openBookingModal = (e) => {
                if (e) e.preventDefault();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock scroll
            };

            // Close Modal Function
            window.closeBookingModal = () => {
                modal.classList.remove('active');
                document.body.style.overflow = ''; // Unlock scroll

                // Reset form and view after a delay
                setTimeout(() => {
                    form.style.display = 'block';
                    successMsg.style.display = 'none';
                    form.reset();
                    submitBtn.disabled = false;
                    spinner.style.display = 'none';
                    btnText.textContent = 'Schedule Meeting';
                }, 400);
            };

            closeBtn.onclick = closeBookingModal;
            modal.onclick = (e) => { if (e.target === modal) closeBookingModal(); };

            // Form Logic
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('booking-name').value;
                const email = document.getElementById('booking-email').value;
                const phone = document.getElementById('booking-phone').value;
                const company = document.getElementById('booking-company').value;
                const date = document.getElementById('booking-date').value;
                const time = document.getElementById('booking-time').value;
                const message = document.getElementById('booking-message').value;

                submitBtn.disabled = true;
                spinner.style.display = 'block';
                btnText.textContent = 'Checking availability...';

                try {
                    // 1. Check Availability (Dynamic Import Firebase for Slot Check)
                    // We'll use the same Firebase config as the site
                    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js");
                    const { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js");

                    const firebaseConfig = {
                        apiKey: "AIzaSyBUPmtsWmM5tvFBDiloryBGgWBX9vIeU4w",
                        authDomain: "uptura-leads.firebaseapp.com",
                        projectId: "uptura-leads",
                        storageBucket: "uptura-leads.firebasestorage.app",
                        messagingSenderId: "146306181969",
                        appId: "1:146306181969:web:c91b776edc33f652c2c170"
                    };

                    const app = initializeApp(firebaseConfig);
                    const db = getFirestore(app);

                    // Slot Check
                    const q = query(collection(db, "leads"), where("appointmentDate", "==", date), where("appointmentTime", "==", time));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        alert("Ops! This slot is already taken. Please pick another time.");
                        submitBtn.disabled = false;
                        spinner.style.display = 'none';
                        btnText.textContent = 'Schedule Meeting';
                        return;
                    }

                    btnText.textContent = 'Scheduling...';

                    // 2. Save to Firebase
                    const leadData = {
                        name, email, phone, company, appointmentDate: date, appointmentTime: time, message,
                        status: 'pending',
                        createdAt: serverTimestamp(),
                        source: 'Booking Modal'
                    };
                    await addDoc(collection(db, "leads"), leadData);

                    // Generate Google Calendar Link for Admin
                    const [year, month, day] = date.split('-');
                    const [hour, minute] = time.split(':');

                    // Convert to UTC assuming EST (UTC-5)
                    const eventStart = new Date(Date.UTC(year, month - 1, day, parseInt(hour) + 5, parseInt(minute)));
                    const eventEnd = new Date(Date.UTC(year, month - 1, day, parseInt(hour) + 5, parseInt(minute) + 30)); // 30-minute Strategy Call

                    const formatGCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

                    const gCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Strategy+Call+with+${encodeURIComponent(name)}&dates=${formatGCalDate(eventStart)}/${formatGCalDate(eventEnd)}&details=Client+Email:+${encodeURIComponent(email)}%0ACompany:+${encodeURIComponent(company)}%0A%0AMessage:%0A${encodeURIComponent(message)}`;

                    // 3. Send Email Notification
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: 'info@uptura.net',
                            subject: `New Call Requested: ${name}`,
                            html: `
                                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                                    <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
                                        <img src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/695861fb4062b42c0bd5c2cd_Logo%20Main.png" alt="Uptura" height="40" style="display: block; margin: 0 auto; height: 40px;">
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #FF3C00 0%, #FF5722 100%); padding: 15px; border-radius: 8px; color: white; text-align: center; margin-bottom: 25px;">
                                        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Booking Request Received</h2>
                                    </div>

                                    <div style="padding: 0 15px;">
                                        <p style="font-size: 15px; color: #444; margin-top: 0;">A new prospect has requested a strategy call. Here are the details:</p>
                                        
                                        <table style="width: 100%; border-collapse: collapse; margin-top: 25px;">
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; width: 130px; color: #666; font-weight: 600; font-size: 14px;">CLIENT NAME:</td>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-weight: 600; font-size: 15px;">${name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #666; font-weight: 600; font-size: 14px;">EMAIL ADDRESS:</td>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-weight: 500; font-size: 15px;"><a href="mailto:${email}" style="color: #FF3C00; text-decoration: none;">${email}</a></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #666; font-weight: 600; font-size: 14px;">DATE & TIME:</td>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-weight: 700; font-size: 16px;">${date} at ${time} EST</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #666; font-weight: 600; font-size: 14px;">COMPANY:</td>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-weight: 500; font-size: 15px;">${company || 'Not Provided'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 5px 0; color: #666; font-weight: 600; font-size: 14px;">MESSAGE:</td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 15px; background-color: #f9f9f9; border-radius: 6px; color: #444; line-height: 1.6; font-size: 14px; border: 1px solid #f0f0f0;">
                                                    ${message || 'No additional details provided by the client.'}
                                                </td>
                                            </tr>
                                        </table>

                                        <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                                            <a href="${gCalLink}" style="display: inline-block; padding: 14px 30px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; transition: opacity 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                                📅 Add to Google Calendar
                                            </a>
                                        </div>
                                        
                                        <p style="text-align: center; color: #888; font-size: 13px; margin-top: 30px; margin-bottom: 0;">
                                            Manage your appointments in the <a href="https://uptura.com/admin.html" style="color: #FF3C00; text-decoration: none; font-weight: 600;">Admin Dashboard</a>.
                                        </p>
                                    </div>
                                </div>
                            `
                        })
                    });

                    // 4. Success State
                    form.style.display = 'none';
                    successMsg.style.display = 'flex';

                } catch (error) {
                    console.error("Booking Error:", error);
                    alert("Something went wrong. Please try again or contact us directly.");
                    submitBtn.disabled = false;
                    spinner.style.display = 'none';
                    btnText.textContent = 'Schedule Meeting';
                }
            });
        });
    }


});
