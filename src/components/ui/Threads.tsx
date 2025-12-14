'use client';

import { useEffect, useRef } from 'react';

interface ThreadsProps {
  amplitude?: number;
  distance?: number;
  enableMouseInteraction?: boolean;
  className?: string;
}

export default function Threads({
  amplitude = 1,
  distance = 0,
  enableMouseInteraction = true,
  className = '',
}: ThreadsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    if (enableMouseInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    // Animation variables
    let time = 0;
    const numThreads = 20;
    const threads: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      phase: number;
    }> = [];

    // Initialize threads
    for (let i = 0; i < numThreads; i++) {
      threads.push({
        x: (canvas.width / numThreads) * i,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      ctx.strokeStyle = 'rgba(107, 114, 128, 0.4)'; // gray-600 with opacity (dark grayish)
      ctx.lineWidth = 1;

      threads.forEach((thread, i) => {
        // Update position with sine wave
        thread.x += thread.vx;
        thread.y += thread.vy + Math.sin(time + thread.phase) * amplitude;

        // Wrap around edges
        if (thread.x < 0) thread.x = canvas.width;
        if (thread.x > canvas.width) thread.x = 0;
        if (thread.y < 0) thread.y = canvas.height;
        if (thread.y > canvas.height) thread.y = 0;

        // Mouse interaction
        if (enableMouseInteraction) {
          const dx = mouseRef.current.x - thread.x;
          const dy = mouseRef.current.y - thread.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            thread.vx += (dx / dist) * force * 0.01;
            thread.vy += (dy / dist) * force * 0.01;
          }
        }

        // Draw connections to nearby threads
        threads.slice(i + 1).forEach((otherThread) => {
          const dx = otherThread.x - thread.x;
          const dy = otherThread.y - thread.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < (distance || 150)) {
            const opacity = 1 - dist / (distance || 150);
            ctx.strokeStyle = `rgba(156, 163, 175, ${opacity * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(thread.x, thread.y);
            ctx.lineTo(otherThread.x, otherThread.y);
            ctx.stroke();
          }
        });

        // Draw thread point
        ctx.fillStyle = 'rgba(107, 114, 128, 0.6)'; // gray-600 (dark grayish)
        ctx.beginPath();
        ctx.arc(thread.x, thread.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (enableMouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [amplitude, distance, enableMouseInteraction]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: enableMouseInteraction ? 'auto' : 'none' }}
    />
  );
}

