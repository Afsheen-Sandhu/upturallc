"use client";

import { useCallback, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCards, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";

const TESTIMONIALS = [
  { video: "/videos/vid1.mp4" },
  { video: "/videos/vid2.mp4" },
  { video: "/videos/vid3.mp4" },
  { video: "/videos/vid4.mp4" },
];

function initialMutedState() {
  return TESTIMONIALS.map(() => true);
}

export default function TestimonialCarousel() {
  const [mutedByIndex, setMutedByIndex] = useState<boolean[]>(initialMutedState);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const applyMuteToAllVideos = useCallback((mutedFlags: boolean[]) => {
    videoRefs.current.forEach((video, i) => {
      if (video) video.muted = mutedFlags[i] ?? true;
    });
  }, []);

  const toggleMute = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedByIndex((prev) => {
      const willUnmute = prev[index];
      const next = prev.map((_, i) => (i === index ? !willUnmute : true));
      applyMuteToAllVideos(next);
      return next;
    });
  };

  const handleSlideChange = (swiper: SwiperType) => {
    const activeIndex = swiper.realIndex;
    setMutedByIndex((prev) => {
      if (prev.every(Boolean)) return prev;
      const next = prev.map((_, i) => i !== activeIndex);
      applyMuteToAllVideos(next);
      return next;
    });
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
        onSlideChange={handleSlideChange}
      >
        {TESTIMONIALS.map((t, index) => {
          const isMuted = mutedByIndex[index] ?? true;
          return (
            <SwiperSlide key={t.video}>
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={t.video}
                autoPlay
                loop
                muted={isMuted}
                playsInline
              />
              <button
                type="button"
                className="video-mute-btn"
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                onClick={(e) => toggleMute(index, e)}
              >
                <i
                  className={`fa-solid ${isMuted ? "fa-volume-xmark" : "fa-volume-high"}`}
                />
              </button>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
