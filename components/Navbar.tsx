"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 top-0 z-50 w-full border-b border-transparent px-6 py-5 md:px-12 ${
        scrolled ? "bg-vacayza-black/90 backdrop-blur-sm border-[#222]" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#" className="text-xs uppercase tracking-[0.2em] text-vacayza-off-white">
          VACAYZA
        </a>
        <div className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted md:flex">
          <a href="#how" className="hover:text-vacayza-off-white">
            How It Works
          </a>
          <a href="#calculator" className="hover:text-vacayza-off-white">
            Returns Calculator
          </a>
          <a href="#why-ct" className="hover:text-vacayza-off-white">
            Why Cape Town
          </a>
          <a href="#contact" className="text-vacayza-amber hover:underline">
            Request Report
          </a>
        </div>
      </div>
    </nav>
  );
}
