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

const AUTOPLAY_DELAY_MS = 4500;

function allMuted() {
  return TESTIMONIALS.map(() => true);
}

export default function TestimonialCarousel() {
  const [mutedByIndex, setMutedByIndex] = useState<boolean[]>(allMuted);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const swiperRef = useRef<SwiperType | null>(null);
  const fullPlayRef = useRef(false);

  const resetAllVideosMuted = useCallback(() => {
    setMutedByIndex(allMuted());
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.muted = true;
      video.loop = true;
    });
  }, []);

  const playActiveSlideMuted = useCallback((activeIndex: number) => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      video.muted = true;
      video.loop = true;
      if (i === activeIndex) {
        video.currentTime = 0;
        void video.play().catch(() => {});
      }
    });
  }, []);

  const resumeCarouselAutoplay = useCallback(() => {
    fullPlayRef.current = false;
    const swiper = swiperRef.current;
    if (!swiper?.autoplay) return;
    swiper.params.autoplay = {
      ...(typeof swiper.params.autoplay === "object" ? swiper.params.autoplay : {}),
      delay: AUTOPLAY_DELAY_MS,
      disableOnInteraction: false,
    };
    swiper.autoplay.start();
  }, []);

  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      fullPlayRef.current = false;
      resetAllVideosMuted();
      playActiveSlideMuted(swiper.realIndex);
      resumeCarouselAutoplay();
    },
    [resetAllVideosMuted, playActiveSlideMuted, resumeCarouselAutoplay]
  );

  const handleVideoEnded = useCallback(
    (index: number) => {
      if (!fullPlayRef.current) return;

      fullPlayRef.current = false;
      const video = videoRefs.current[index];
      if (video) {
        video.muted = true;
        video.loop = true;
      }
      resetAllVideosMuted();

      const swiper = swiperRef.current;
      if (!swiper) return;

      swiper.slideNext();
      resumeCarouselAutoplay();
    },
    [resetAllVideosMuted, resumeCarouselAutoplay]
  );

  const toggleMute = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const swiper = swiperRef.current;
    const video = videoRefs.current[index];
    if (!swiper || !video) return;

    if (swiper.realIndex !== index) return;

    const isMuted = mutedByIndex[index] ?? true;

    if (isMuted) {
      fullPlayRef.current = true;
      swiper.autoplay?.stop();

      setMutedByIndex((prev) => prev.map((_, i) => i !== index));
      video.loop = false;
      video.muted = false;
      video.currentTime = 0;
      void video.play().catch(() => {});
      return;
    }

    fullPlayRef.current = false;
    video.muted = true;
    video.loop = true;
    resetAllVideosMuted();
    resumeCarouselAutoplay();
  };

  return (
    <div className="testimonial-swiper-container">
      <Swiper
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards, Autoplay]}
        className="testimonialSwiper"
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        autoplay={{
          delay: AUTOPLAY_DELAY_MS,
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
                loop={isMuted}
                muted={isMuted}
                playsInline
                onEnded={() => handleVideoEnded(index)}
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
