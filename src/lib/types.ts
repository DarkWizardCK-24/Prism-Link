export type ButtonStyle = "solid" | "glass" | "outline";
export type ButtonShape = "pill" | "rounded" | "square";
export type BgType = "theme" | "color" | "gradient" | "image";
export type ItemKind = "link" | "header" | "divider" | "embed";
export type IconKind = "auto" | "emoji" | "image";

export interface SocialLink {
  id: string;
  url: string;
}

export interface Profile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  theme: string;
  buttonStyle: ButtonStyle;
  buttonShape: ButtonShape;
  socials: SocialLink[];
  bgType: BgType;
  bgColor: string;
  bgColor2: string;
  bgImage: string;
  bgOverlay: number;
  views: number;
  createdAt: number;
}

export interface LinkItem {
  id: string;
  kind: ItemKind;
  title: string;
  url: string;
  active: boolean;
  order: number;
  clicks: number;
  createdAt: number;
  iconType: IconKind;
  emoji: string;
  thumbnail: string;
  startAt: number | null;
  endAt: number | null;
  collapsible: boolean;
}

export interface AnalyticsEvent {
  type: "view" | "click";
  linkId?: string;
  ts: number;
  day: string;
  ref: string;
  device: "mobile" | "tablet" | "desktop";
  country: string;
}

export const PROFILE_DEFAULTS = {
  socials: [] as SocialLink[],
  bgType: "theme" as BgType,
  bgColor: "#e11d48",
  bgColor2: "#7c3aed",
  bgImage: "",
  bgOverlay: 30,
};

export const LINK_DEFAULTS = {
  kind: "link" as ItemKind,
  iconType: "auto" as IconKind,
  emoji: "",
  thumbnail: "",
  startAt: null as number | null,
  endAt: null as number | null,
  collapsible: false,
};

/** A link is visible when active and inside its optional schedule window. */
export function isLive(l: Pick<LinkItem, "active" | "startAt" | "endAt">, now: number) {
  return l.active && (!l.startAt || now >= l.startAt) && (!l.endAt || now < l.endAt);
}
