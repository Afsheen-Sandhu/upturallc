"use client";

import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";

const TESTIMONIALS = [
  { video: "/videos/vid1.mp4" },
  { video: "/videos/vid2.mp4" },
  { video: "/videos/vid3.mp4" },
  { video: "/videos/vid4.mp4" },
];

export default function TestimonialCarousel() {
  const [muted, setMuted] = useState(true);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(!muted);
  };

  return (
    <div className="testimonial-swiper-container">
      <Swiper
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards, Autoplay]}
        className="testimonialSwiper"
        autoplay={{
            delay: 4500,
            disableOnInteraction: false,
        }}
      >
        {TESTIMONIALS.map((t, index) => (
          <SwiperSlide key={index}>
            <video 
              src={t.video} 
              autoPlay 
              loop 
              muted={muted} 
              playsInline 
            />
            <button 
              className="video-mute-btn" 
              title="Toggle Mute"
              onClick={toggleMute}
            >
              <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
