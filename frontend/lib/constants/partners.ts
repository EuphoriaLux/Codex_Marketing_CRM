import { OfferEventType, OnboardingStepKey, PartnershipStage } from "@/lib/types";

export const LUXEMBOURG_CANTONS = [
  "Capellen",
  "Clervaux",
  "Diekirch",
  "Echternach",
  "Esch-sur-Alzette",
  "Grevenmacher",
  "Luxembourg",
  "Mersch",
  "Redange",
  "Remich",
  "Vianden",
  "Wiltz",
] as const;

export type LuxembourgCanton = (typeof LUXEMBOURG_CANTONS)[number];

export const STAGE_OPTIONS: { value: PartnershipStage; label: string; class: string }[] = [
  { value: "Prospect", label: "Prospect", class: "prospect" },
  { value: "Negotiating", label: "En négociation", class: "negotiating" },
  { value: "Active", label: "Actif", class: "active" },
  { value: "Paused", label: "En pause", class: "paused" },
  { value: "Archived", label: "Archivé", class: "archived" },
];

export const STAGE_CLASSES: Record<PartnershipStage, string> = {
  Prospect: "prospect",
  Negotiating: "negotiating",
  Active: "active",
  Paused: "paused",
  Archived: "archived",
};

export const STAGE_LABELS: Record<PartnershipStage, string> = {
  Prospect: "Prospect",
  Negotiating: "En négociation",
  Active: "Actif",
  Paused: "En pause",
  Archived: "Archivé",
};

export const EVENT_TYPE_OPTIONS: { value: OfferEventType; label: string; icon: string }[] = [
  { value: "speed_dating", label: "Speed Dating", icon: "🍷" },
  { value: "mixer", label: "Social Mixer", icon: "🍸" },
  { value: "activity", label: "Atelier / Activité", icon: "🎨" },
  { value: "themed", label: "Soirée à thème", icon: "✨" },
  { value: "quiz_night", label: "Quiz Night", icon: "❓" },
  { value: "crush_cache", label: "Crush Cache Hunt", icon: "🗺️" },
];

export const EVENT_TYPE_MAP: Record<OfferEventType, { label: string; icon: string }> = {
  speed_dating: { label: "Speed Dating", icon: "🍷" },
  mixer: { label: "Social Mixer", icon: "🍸" },
  activity: { label: "Atelier / Activité", icon: "🎨" },
  themed: { label: "Soirée à thème", icon: "✨" },
  quiz_night: { label: "Quiz Night", icon: "❓" },
  crush_cache: { label: "Crush Cache Hunt", icon: "🗺️" },
};

export const WEEKDAYS_MAP = [
  { day: 0, short: "Lun", label: "Lundi" },
  { day: 1, short: "Mar", label: "Mardi" },
  { day: 2, short: "Mer", label: "Mercredi" },
  { day: 3, short: "Jeu", label: "Jeudi" },
  { day: 4, short: "Ven", label: "Vendredi" },
  { day: 5, short: "Sam", label: "Samedi" },
  { day: 6, short: "Dim", label: "Dimanche" },
];

export const ONBOARDING_STEPS_CONFIG: {
  key: OnboardingStepKey;
  label: string;
  description: string;
}[] = [
  {
    key: "contact_made",
    label: "Premier contact établi",
    description: "Échange initial et présentation du concept Crush",
  },
  {
    key: "terms_agreed",
    label: "Conditions commerciales validées",
    description: "Accord sur le modèle économique, minimum spend ou part de CA",
  },
  {
    key: "venue_visit",
    label: "Visite du lieu effectuée",
    description: "Repérage technique : agencement des tables, acoustique, lumière",
  },
  {
    key: "photos",
    label: "Photos & visuels récoltés",
    description: "Visuels haute définition pour la promotion billetterie",
  },
  {
    key: "house_rules",
    label: "Règlement intérieur enregistré",
    description: "Horaires de fermeture, volume sonore, gestion des commandes",
  },
  {
    key: "test_event",
    label: "Événement test organisé",
    description: "Première session pilote avec debriefing équipe & gérant",
  },
  {
    key: "echo_venue_registered",
    label: "Fiche lieu sur echo.lu",
    description: "Liaison avec la base des salles et événements culturels",
  },
  {
    key: "active",
    label: "Partenaire validé & actif",
    description: "Lieu officiellement intégré à la programmation récurrente",
  },
];
