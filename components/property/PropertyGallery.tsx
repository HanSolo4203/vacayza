"use client";

import { useCallback, useEffect, useState } from "react";
import Property24Image from "./Property24Image";

export default function PropertyGallery({
  images,
  title,
  variant = "page",
}: {
  images: string[];
  title: string;
  variant?: "page" | "hero";
}) {
  const photos = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeSrc = photos[activeIndex] ?? photos[0];

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i >= photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, goPrev, goNext]);

  if (photos.length === 0) return null;

  if (variant === "hero") {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 cursor-zoom-in"
          aria-label="Open photo gallery"
        >
          {activeSrc && (
            <Property24Image
              src={activeSrc}
              alt={title}
              size="hero"
              fill
              className="object-cover opacity-60"
              priority
            />
          )}
        </button>
        {photos.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-vacayza-black/80 px-4 py-3 backdrop-blur-sm md:px-12">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-vacayza-muted">
                {activeIndex + 1} / {photos.length}
              </span>
              <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                {photos.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-14 w-20 shrink-0 overflow-hidden border transition ${
                      index === activeIndex ? "border-vacayza-amber" : "border-[#444] opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View photo ${index + 1}`}
                  >
                    <Property24Image src={src} alt="" size="thumb" fill className="object-cover" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="shrink-0 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber hover:underline"
              >
                View all
              </button>
            </div>
          </div>
        )}
        {lightboxOpen && (
          <GalleryLightbox
            photos={photos}
            title={title}
            activeIndex={activeIndex}
            onClose={() => setLightboxOpen(false)}
            onSelect={setActiveIndex}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
      </>
    );
  }

  return (
    <section className="border-b border-[#222] px-6 py-16 md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— PHOTOS</p>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-3xl text-vacayza-off-white md:text-4xl">Property gallery</h2>
          <span className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="relative mb-4 aspect-[16/9] w-full overflow-hidden border border-[#333] bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]"
          aria-label="Open full-screen gallery"
        >
          <Property24Image src={activeSrc} alt={title} size="hero" fill className="object-cover" priority />
        </button>

        {photos.length > 1 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {photos.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setLightboxOpen(true);
                }}
                className={`relative aspect-[4/3] overflow-hidden border transition ${
                  index === activeIndex ? "border-vacayza-amber" : "border-[#333] hover:border-vacayza-muted"
                }`}
                aria-label={`View photo ${index + 1}`}
              >
                <Property24Image src={src} alt="" size="thumb" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <GalleryLightbox
          photos={photos}
          title={title}
          activeIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onSelect={setActiveIndex}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </section>
  );
}

function GalleryLightbox({
  photos,
  title,
  activeIndex,
  onClose,
  onSelect,
  onPrev,
  onNext,
}: {
  photos: string[];
  title: string;
  activeIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const src = photos[activeIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Property photo gallery"
    >
      <div className="flex items-center justify-between border-b border-[#333] px-4 py-3 md:px-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
          {activeIndex + 1} / {photos.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber hover:underline"
        >
          Close
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 py-6 md:px-16">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-2 z-10 border border-[#444] px-3 py-2 text-xl text-vacayza-off-white hover:border-vacayza-amber md:left-6"
            aria-label="Previous photo"
          >
            ‹
          </button>
        )}
        <div className="relative h-full w-full max-h-[70vh] max-w-6xl">
          {src && (
            <Property24Image
              src={src}
              alt={`${title} — photo ${activeIndex + 1}`}
              size="gallery"
              fill
              className="object-contain"
            />
          )}
        </div>
        {photos.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-2 z-10 border border-[#444] px-3 py-2 text-xl text-vacayza-off-white hover:border-vacayza-amber md:right-6"
            aria-label="Next photo"
          >
            ›
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <div className="border-t border-[#333] px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
            {photos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => onSelect(index)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden border ${
                  index === activeIndex ? "border-vacayza-amber" : "border-[#444] opacity-60"
                }`}
                aria-label={`Photo ${index + 1}`}
              >
                <Property24Image src={photo} alt="" size="thumb" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
