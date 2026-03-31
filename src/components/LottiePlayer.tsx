"use client";

import { Player } from "@lottiefiles/react-lottie-player";

interface LottiePlayerProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  autoplay?: boolean;
}

export default function LottiePlayer({ src, className, style, loop = true, autoplay = true }: LottiePlayerProps) {
  return (
    <Player
      autoplay={autoplay}
      loop={loop}
      src={src}
      className={className}
      style={style}
    />
  );
}
