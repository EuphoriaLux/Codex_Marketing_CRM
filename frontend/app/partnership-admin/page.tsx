"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/section-header";

const PUBLIC_PATH = "/partnership/";

export default function PartnershipAdminPage() {
  const [publicUrl, setPublicUrl] = useState(PUBLIC_PATH);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}${PUBLIC_PATH}`);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the URL element so the user can copy manually
      const el = document.getElementById("partnership-public-url");
      if (el && window.getSelection) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <main className="page">
      <SectionHeader
        eyebrow="Partnership preview"
        title="Formulaire public — proposition de lieu"
        description="Aperçu interne du formulaire que voient les exploitants de lieux. Copie le lien ci-dessous pour le leur transmettre — ils accèdent uniquement à la version publique, sans la barre latérale du hub."
      />

      <div className="partnership-admin-bar">
        <div className="partnership-admin-link">
          <span className="partnership-admin-label">Lien public</span>
          <code id="partnership-public-url" className="partnership-admin-url">
            {publicUrl}
          </code>
        </div>
        <div className="partnership-admin-actions">
          <button type="button" className="button secondary" onClick={copyLink}>
            {copied ? "Lien copié ✓" : "Copier le lien"}
          </button>
          <a
            href={PUBLIC_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="button"
          >
            Ouvrir dans un onglet
          </a>
        </div>
      </div>

      <div className="partnership-frame-wrap">
        <iframe
          src={PUBLIC_PATH}
          title="Aperçu du formulaire public Partnership"
          className="partnership-frame"
        />
      </div>
    </main>
  );
}
