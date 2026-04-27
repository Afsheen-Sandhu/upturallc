"use client";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const TESTIMONIALS = [
    { 
        id: 'a1', 
        cat: 'WEB DEVELOPMENT', 
        title: 'The website feels faster and more professional.', 
        text: 'We needed a custom website that actually represented our brand. The final result was clean, fast, and easy to manage. Our customers noticed the difference immediately.', 
        author: '— Founder, Service-Based Business', 
        audio: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696cd27dcdb5319aee232c2d_Test%201%20on%20hompage.mp3' 
    },
    { 
        id: 'a2', 
        cat: 'WEB DEVELOPMENT', 
        title: 'Exactly what we needed, without overcomplicating things.', 
        text: 'They understood our requirements clearly and built a site that works perfectly across devices. The process was smooth from start to finish.', 
        author: '— Operations Manager, SME', 
        audio: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696cd27d5c5f7359cf2910bd_test%202%20on%20homepage.mp3' 
    },
    { 
        id: 'a3', 
        cat: 'SEO SERVICES', 
        title: 'Organic traffic started growing steadily.', 
        text: 'SEO takes time, but their approach was realistic and transparent. Within a few months, we saw consistent growth and higher rankings.', 
        author: '— Business Owner, Local Company', 
        audio: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696cd27d2a368dd983dad350_test%203%20on%20homepage.mp3' 
    },
    { 
        id: 'a4', 
        cat: 'SEO SERVICES', 
        title: 'We finally understand where our leads come from.', 
        text: 'Their SEO work helped us rank for keywords that actually convert. Reporting was clear, and the results spoke for themselves.', 
        author: '— Marketing Lead, B2B Firm', 
        audio: 'https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/696cd27d2744704a3919131d_test%20homepage%20seo%20(1).mp3' 
    }
];

export default function TestimonialAudioCarousel() {
    const [playingId, setPlayingId] = useState<string | null>(null);

    const toggleAudio = (id: string, url: string) => {
        const audio = document.getElementById(id) as HTMLAudioElement;
        if (!audio) return;

        if (playingId === id) {
            audio.pause();
            setPlayingId(null);
        } else {
            // Stop all other audios
            document.querySelectorAll('audio').forEach(a => {
                (a as HTMLAudioElement).pause();
                (a as HTMLAudioElement).currentTime = 0;
            });
            audio.play();
            setPlayingId(id);
        }
    };

    return (
        <div className="testimonial-audio-carousel-wrapper" style={{ paddingBottom: '60px', overflow: 'hidden' }}>
            <style jsx global>{`
                .testimonial-audio-swiper {
                    padding: 50px 0 100px !important;
                    overflow: visible !important;
                }
                .testimonial-audio-swiper .swiper-slide {
                    transition: all 0.5s ease;
                    opacity: 0.4;
                    filter: blur(8px);
                    transform: scale(0.9);
                }
                .testimonial-audio-swiper .swiper-slide-active {
                    opacity: 1;
                    filter: blur(0);
                    transform: scale(1);
                    z-index: 2;
                }
                .testimonial-audio-swiper .swiper-pagination-bullet {
                    background: #1a1a1a;
                    width: 8px;
                    height: 8px;
                    opacity: 0.2;
                    margin: 0 6px !important;
                }
                .testimonial-audio-swiper .swiper-pagination-bullet-active {
                    background: #FF3C00;
                    opacity: 1;
                }
            `}</style>
            
            <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={30}
                slidesPerView={1.3}
                centeredSlides={true}
                loop={true}
                pagination={{ clickable: true }}
                autoplay={{
                    delay: 6000,
                    disableOnInteraction: true,
                }}
                breakpoints={{
                    320: { slidesPerView: 1 },
                    768: { slidesPerView: 1.15 },
                    1024: { slidesPerView: 1.3 }
                }}
                className="testimonial-audio-swiper"
            >
                {TESTIMONIALS.map((t) => (
                    <SwiperSlide key={t.id} style={{ display: 'flex' }}>
                        <div className="testimonial-slide-card" style={{ 
                            backgroundColor: '#ffffff', 
                            borderRadius: '45px', 
                            padding: '60px', 
                            margin: '0 20px',
                            position: 'relative',
                            width: '100%',
                            boxShadow: '0 15px 50px rgba(0,0,0,0.04)',
                            textAlign: 'left'
                        }}>
                             <div className="testimonial-category" style={{ 
                                color: '#FF3C00', 
                                fontSize: '0.8rem', 
                                fontWeight: 800, 
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '18px'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                {t.cat}
                            </div>
                            <div className="testimonial-stars" style={{ color: '#FFB800', fontSize: '1.2rem', marginBottom: '25px' }}>⭐⭐⭐⭐⭐</div>
                            <h3 style={{ fontSize: '1.9rem', fontWeight: 850, margin: '0 0 20px', color: '#1a1a1a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{t.title}</h3>
                            <p style={{ color: '#666', lineHeight: 1.6, fontSize: '1.1rem', marginBottom: '35px' }}>{t.text}</p>
                            <div className="testimonial-author" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '40px', color: '#1a1a1a' }}>{t.author}</div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <button 
                                    className="testimonial-audio-btn" 
                                    style={{
                                        backgroundColor: '#FF3C00',
                                        color: '#ffffff',
                                        padding: '16px 35px',
                                        borderRadius: '100px',
                                        border: 'none',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'transform 0.2s ease, background-color 0.2s ease'
                                    }}
                                    onClick={() => toggleAudio(t.id, t.audio)}
                                >
                                    <span>{playingId === t.id ? '⏸' : '▶'}</span> {playingId === t.id ? 'Pause Audio' : 'Play Audio'}
                                </button>
                                
                                {playingId === t.id && (
                                    <div className="audio-wave" style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '24px' }}>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="wave-bar" style={{ 
                                                width: '3px', 
                                                height: '18px', 
                                                backgroundColor: '#FF3C00', 
                                                borderRadius: '10px',
                                                animation: 'wave 0.5s ease-in-out infinite alternate',
                                                animationDelay: `${i * 0.1}s`
                                            }}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <audio id={t.id} src={t.audio} onEnded={() => setPlayingId(null)}></audio>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style jsx>{`
                @keyframes wave {
                    0% { height: 6px; }
                    100% { height: 24px; }
                }
                .testimonial-audio-btn:active {
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    );
}
