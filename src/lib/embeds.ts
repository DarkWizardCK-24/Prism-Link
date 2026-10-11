export interface Embed {
  provider: "YouTube" | "Spotify" | "SoundCloud";
  src: string;
  /** Fixed pixel height, or null when the embed uses a 16:9 aspect ratio. */
  height: number | null;
}

/** Converts a share URL into a safe embed URL. Only whitelisted providers are supported. */
export function parseEmbed(input: string): Embed | null {
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|music)\./, "");

  if (host === "youtu.be" || host === "youtube.com") {
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
    else {
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
      if (m) id = m[2];
    }
    id = id.split("/")[0];
    return /^[\w-]{6,15}$/.test(id)
      ? { provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/${id}`, height: null }
      : null;
  }

  if (host === "open.spotify.com") {
    const m = u.pathname.match(/^\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return {
      provider: "Spotify",
      src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
      height: m[1] === "track" || m[1] === "episode" ? 152 : 352,
    };
  }

  if (host === "soundcloud.com") {
    if (u.pathname.split("/").filter(Boolean).length < 1) return null;
    const track = `https://soundcloud.com${u.pathname}`;
    return {
      provider: "SoundCloud",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(track)}&color=%23e11d48&visual=false&show_comments=false`,
      height: 166,
    };
  }

  return null;
}
