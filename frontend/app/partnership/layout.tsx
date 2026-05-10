import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Proposer un lieu — Crush.lu",
  description:
    "Vous exploitez une salle, un rooftop, un restaurant ou un espace atypique au Luxembourg ? Proposez votre lieu à Crush.lu pour accueillir nos événements.",
};

export default function PartnershipLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
