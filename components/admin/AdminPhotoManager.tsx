"use client";

import { useState } from "react";
import Property24Image from "../property/Property24Image";

export default function AdminPhotoManager({
  images,
  title,
  onChange,
}: {
  images: string[];
  title: string;
  onChange: (images: string[]) => void;
}) {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const photos = images.filter(Boolean);
  const safePreview = Math.min(previewIndex, Math.max(0, photos.length - 1));
  const heroSrc = photos[safePreview] ?? photos[0];

  const updatePhotos = (next: string[]) => {
    onChange(next);
    if (safePreview >= next.length) setPreviewIndex(Math.max(0, next.length - 1));
  };

  const removePhoto = (index: number) => {
    updatePhotos(photos.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const next = [...photos];
    const [photo] = next.splice(index, 1);
    next.unshift(photo);
    updatePhotos(next);
    setPreviewIndex(0);
  };

  const saveEdit = (index: number) => {
    const trimmed = editUrl.trim();
    if (!trimmed) return;
    const next = [...photos];
    next[index] = trimmed;
    updatePhotos(next);
    setEditingIndex(null);
    setEditUrl("");
  };

  const addPhoto = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    updatePhotos([...photos, trimmed]);
    setNewUrl("");
    setPreviewIndex(photos.length);
  };

  if (photos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex h-48 items-center justify-center border border-[#333] bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">No photos</p>
        </div>
        <AddPhotoInput value={newUrl} onChange={setNewUrl} onAdd={addPhoto} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">
          {photos.length} {photos.length === 1 ? "photo" : "photos"} — click to preview
        </p>
        {safePreview !== 0 && (
          <button
            type="button"
            onClick={() => setAsCover(safePreview)}
            className="text-[10px] uppercase tracking-[0.15em] text-vacayza-amber hover:underline"
          >
            Set as cover
          </button>
        )}
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden border border-[#333] bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
        {heroSrc ? (
          <Property24Image src={heroSrc} alt={title} size="hero" fill className="object-cover" priority />
        ) : null}
        {safePreview === 0 && (
          <span className="absolute left-3 top-3 bg-vacayza-amber px-2 py-1 text-[9px] uppercase tracking-[0.15em] text-black">
            Cover
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {photos.map((image, index) => (
          <div key={`${image}-${index}`} className="group relative">
            <button
              type="button"
              onClick={() => setPreviewIndex(index)}
              className={`relative aspect-[4/3] w-full overflow-hidden border transition ${
                index === safePreview ? "border-vacayza-amber" : "border-[#333] hover:border-vacayza-muted"
              }`}
              aria-label={`Preview photo ${index + 1}`}
            >
              <Property24Image src={image} alt="" size="thumb" fill className="object-cover" />
              {index === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/75 py-0.5 text-[8px] uppercase tracking-[0.1em] text-vacayza-amber">
                  Cover
                </span>
              )}
            </button>

            <div className="absolute right-1 top-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => setAsCover(index)}
                  title="Set as cover"
                  className="flex h-6 w-6 items-center justify-center bg-black/90 text-[10px] text-vacayza-amber hover:bg-vacayza-amber hover:text-black"
                  aria-label="Set as cover"
                >
                  ★
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(index);
                  setEditUrl(image);
                }}
                title="Edit URL"
                className="flex h-6 w-6 items-center justify-center bg-black/90 text-[10px] text-vacayza-off-white hover:bg-vacayza-amber hover:text-black"
                aria-label="Edit photo URL"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                title="Remove photo"
                className="flex h-6 w-6 items-center justify-center bg-black/90 text-[10px] text-red-400 hover:bg-red-900 hover:text-white"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>

            {editingIndex === index && (
              <div className="absolute inset-x-0 top-full z-10 mt-1 space-y-1 border border-[#333] bg-black p-2">
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full border border-[#333] bg-black p-1.5 font-mono text-[10px] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber"
                  placeholder="Image URL"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => saveEdit(index)}
                    className="flex-1 bg-vacayza-amber px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-black"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="flex-1 border border-[#333] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-vacayza-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <AddPhotoInput value={newUrl} onChange={setNewUrl} onAdd={addPhoto} />
    </div>
  );
}

function AddPhotoInput({
  value,
  onChange,
  onAdd,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        placeholder="Add image URL..."
        className="min-w-0 flex-1 border border-[#333] bg-black p-2 font-mono text-[10px] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber"
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        className="shrink-0 border border-vacayza-amber px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber disabled:opacity-40"
      >
        Add
      </button>
    </div>
  );
}
