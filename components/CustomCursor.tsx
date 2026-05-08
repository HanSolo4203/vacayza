"use client";

import { useEffect, useRef, useState } from "react";

const LERP = 0.17;

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringPos = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const isInteractiveRef = useRef(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    isInteractiveRef.current = isInteractive;
  }, [isInteractive]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${event.clientX - 3}px, ${event.clientY - 3}px, 0)`;
      }
    };

    const loop = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * LERP;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * LERP;
      if (ringRef.current) {
        const size = isInteractiveRef.current ? 40 : 24;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
        ringRef.current.style.transform = `translate3d(${ringPos.current.x - size / 2}px, ${ringPos.current.y - size / 2}px, 0)`;
      }
      rafRef.current = window.requestAnimationFrame(loop);
    };

    const setInteractive = (target: EventTarget | null, state: boolean) => {
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest("a,button,[role='button'],input,textarea,select")) {
        setIsInteractive(state);
      }
    };

    const handleOver = (event: MouseEvent) => setInteractive(event.target, true);
    const handleOut = (event: MouseEvent) => setInteractive(event.target, false);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className={`pointer-events-none fixed left-0 top-0 z-[9999] h-[6px] w-[6px] rounded-full bg-white transition-opacity duration-200 ${
          isInteractive ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-vacayza-amber transition-[width,height] duration-200"
      />
    </>
  );
}
