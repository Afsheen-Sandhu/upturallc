"use client";

import dynamic from "next/dynamic";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((m) => m.Player),
  { ssr: false }
);

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
