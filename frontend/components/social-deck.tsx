"use client";

import { useState } from "react";
import Image from "next/image";
import type { SocialPost } from "@/lib/types";

export function SocialDeck({ post }: { post: SocialPost }) {
  const images = post.media_urls?.length ? post.media_urls : post.media_url ? [post.media_url] : [];
  const [index, setIndex] = useState(0);
  if (!images.length) return null;
  const active = Math.min(index, images.length - 1);
  return (
    <div style={{ margin: "0.75rem 0" }}>
      <Image src={images[active]} width={1080} height={1080} unoptimized
        alt={`Diapositive ${active + 1} sur ${images.length} — ${post.hook || "Publication Crush.lu"}`}
        style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} />
      {images.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }} aria-label="Diapositives du carrousel">
          {images.map((_url, slide) => (
            <button key={slide} type="button" className="button button-secondary"
              aria-label={`Voir la diapositive ${slide + 1}`} aria-pressed={active === slide}
              onClick={() => setIndex(slide)} style={{ padding: "0.3rem 0.65rem", outline: active === slide ? "2px solid #c4b5fd" : undefined }}>
              {slide + 1}
            </button>
          ))}
          <span style={{ alignSelf: "center", fontSize: "0.8rem" }}>{active + 1} / {images.length}</span>
        </div>
      )}
    </div>
  );
}
