import type { CSSProperties } from 'react';

type OrbitMarkProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export default function OrbitMark({ size = 40, className, style }: OrbitMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="8.5" fill="currentColor" opacity="0.95" />
      <ellipse cx="24" cy="24" rx="20" ry="8.5" stroke="currentColor" strokeWidth="1.4" opacity="0.75" transform="rotate(-24 24 24)" />
      <ellipse cx="24" cy="24" rx="20" ry="8.5" stroke="currentColor" strokeWidth="1.1" opacity="0.35" transform="rotate(58 24 24)" />
      <circle cx="39" cy="14" r="2.2" fill="currentColor" />
      <circle cx="9" cy="33" r="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
