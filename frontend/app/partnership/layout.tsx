import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Partenariats — Crush.lu",
  description:
    "Sociétés et marques, contactez Crush.lu pour devenir partenaire ou sponsor de nos événements au Luxembourg.",
};

export default function PartnershipLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
