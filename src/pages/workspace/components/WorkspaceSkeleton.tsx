import type { CSSProperties } from "react";

type SkeletonBlockProps = {
  className?: string;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

export function SkeletonBlock({
  className = "",
  width,
  height,
}: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`workspace-skeleton ${className}`.trim()}
      style={{ width, height }}
    />
  );
}
