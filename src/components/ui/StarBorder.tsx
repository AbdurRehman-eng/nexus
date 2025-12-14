'use client';

import React, { useRef } from 'react';

interface StarBorderProps {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export default function StarBorder({
  as: Component = 'div',
  className = '',
  color = '#5A0F0F', // dark-red
  speed = '5s',
  children,
  ...props
}: StarBorderProps) {
  const elementRef = useRef<HTMLElement>(null);

  return (
    <Component
      ref={elementRef}
      className={`star-border-wrapper ${className}`}
      {...props}
    >
      <span className="star-border-content">{children}</span>
      <svg
        className="star-border-svg"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <rect
          className="star-border-rect"
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="10 10"
          strokeDashoffset="0"
          rx="8"
          style={{
            animation: `star-border-animate ${speed} linear infinite`,
          }}
        />
      </svg>
      <style jsx>{`
        .star-border-wrapper {
          position: relative;
          display: inline-block;
          overflow: hidden;
        }

        .star-border-content {
          position: relative;
          z-index: 1;
          display: block;
        }

        @keyframes star-border-animate {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 100;
          }
        }
      `}</style>
    </Component>
  );
}

