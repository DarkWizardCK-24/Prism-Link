import type { ComponentType } from "react";
import {
  FaBehance,
  FaDiscord,
  FaDribbble,
  FaEnvelope,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaMedium,
  FaPinterestP,
  FaReddit,
  FaSnapchat,
  FaSpotify,
  FaTelegram,
  FaTiktok,
  FaTwitch,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { LuGlobe, LuPhone } from "react-icons/lu";
import { normalizeUrl } from "./utils";

export type IconComp = ComponentType<{ className?: string; size?: number | string }>;

const PLATFORMS: Array<{ match: RegExp; name: string; Icon: IconComp }> = [
  { match: /instagram\.com$/, name: "Instagram", Icon: FaInstagram },
  { match: /(youtube\.com|youtu\.be)$/, name: "YouTube", Icon: FaYoutube },
  { match: /(twitter\.com|x\.com)$/, name: "X", Icon: FaXTwitter },
  { match: /linkedin\.com$/, name: "LinkedIn", Icon: FaLinkedinIn },
  { match: /github\.com$/, name: "GitHub", Icon: FaGithub },
  { match: /tiktok\.com$/, name: "TikTok", Icon: FaTiktok },
  { match: /(facebook\.com|fb\.com)$/, name: "Facebook", Icon: FaFacebookF },
  { match: /spotify\.com$/, name: "Spotify", Icon: FaSpotify },
  { match: /(discord\.com|discord\.gg)$/, name: "Discord", Icon: FaDiscord },
  { match: /twitch\.tv$/, name: "Twitch", Icon: FaTwitch },
  { match: /(wa\.me|whatsapp\.com)$/, name: "WhatsApp", Icon: FaWhatsapp },
  { match: /(t\.me|telegram\.org)$/, name: "Telegram", Icon: FaTelegram },
  { match: /pinterest\.[a-z.]+$/, name: "Pinterest", Icon: FaPinterestP },
  { match: /snapchat\.com$/, name: "Snapchat", Icon: FaSnapchat },
  { match: /reddit\.com$/, name: "Reddit", Icon: FaReddit },
  { match: /behance\.net$/, name: "Behance", Icon: FaBehance },
  { match: /dribbble\.com$/, name: "Dribbble", Icon: FaDribbble },
  { match: /medium\.com$/, name: "Medium", Icon: FaMedium },
];

export function getPlatform(url: string): { name: string; Icon: IconComp } {
  const href = normalizeUrl(url);
  if (href.startsWith("mailto:")) return { name: "Email", Icon: FaEnvelope };
  if (href.startsWith("tel:")) return { name: "Phone", Icon: LuPhone };
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    const hit = PLATFORMS.find((p) => p.match.test(host));
    if (hit) return { name: hit.name, Icon: hit.Icon };
  } catch {
    /* fall through */
  }
  return { name: "Website", Icon: LuGlobe };
}
