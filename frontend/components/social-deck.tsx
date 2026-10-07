"use client";

import { useState } from "react";
import Image from "next/image";
import type { SocialPost } from "@/lib/types";

export function SocialDeck({ post, onVideoReady }: { post: SocialPost; onVideoReady?: (ready: boolean) => void }) {
  const images = post.media_urls?.length ? post.media_urls : post.media_url ? [post.media_url] : [];
  const [index, setIndex] = useState(0);
  const [failedVideo, setFailedVideo] = useState<string | null>(null);
  if (!images.length) return null;
  const active = Math.min(index, images.length - 1);
  if (post.media_type === "video") return (
    <div style={{ margin: "0.75rem 0" }}>
      <video key={post.media_url} src={post.media_url || undefined} controls playsInline preload="metadata"
        onLoadedData={() => {setFailedVideo(null); onVideoReady?.(true);}}
        onError={() => {setFailedVideo(post.media_url); onVideoReady?.(false);}}
        aria-label={`Vidéo — ${post.hook || "Publication Crush.lu"}`}
        style={{ width: "100%", maxHeight: 480, borderRadius: 8, background: "#111" }}>
        Votre navigateur ne peut pas lire cette vidéo.
      </video>
      {failedVideo && failedVideo === post.media_url && <p role="alert">Impossible de lire la vidéo. Réessayez avant de la valider.</p>}
      <a href={post.media_url || undefined} target="_blank" rel="noopener noreferrer">Ouvrir la vidéo</a>
    </div>
  );
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
