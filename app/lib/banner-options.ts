export type ProfileBannerMedia =
  | { type: "video"; src: string }
  | { type: "embed"; src: string; thumbnail?: string };

const youtubeIdPattern = /^[\w-]{11}$/;

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || value.length > 2048) return null;
    return url;
  } catch {
    return null;
  }
}

export function getProfileBannerMedia(value: string): ProfileBannerMedia | null {
  const url = safeUrl(value);
  if (!url) return null;

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return { type: "video", src: url.href };
  }

  if (hostname === "youtu.be" || hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtube-nocookie.com") {
    const videoId = hostname === "youtu.be"
      ? pathSegments[0]
      : url.searchParams.get("v") ||
        (["embed", "shorts", "live", "v"].includes(pathSegments[0] || "") ? pathSegments[1] : undefined);
    if (!videoId || !youtubeIdPattern.test(videoId)) return null;

    const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    embedUrl.searchParams.set("autoplay", "1");
    embedUrl.searchParams.set("controls", "0");
    embedUrl.searchParams.set("disablekb", "1");
    embedUrl.searchParams.set("fs", "0");
    embedUrl.searchParams.set("loop", "1");
    embedUrl.searchParams.set("mute", "1");
    embedUrl.searchParams.set("playsinline", "1");
    embedUrl.searchParams.set("playlist", videoId);
    return {
      type: "embed",
      src: embedUrl.href,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
    const videoId = hostname === "player.vimeo.com"
      ? pathSegments[1]
      : pathSegments.find((segment) => /^\d+$/.test(segment));
    if (!videoId) return null;

    const embedUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
    const hash = url.searchParams.get("h") || pathSegments.find((segment) => /^[a-f\d]{8,}$/i.test(segment));
    if (hash) embedUrl.searchParams.set("h", hash);
    embedUrl.searchParams.set("autoplay", "1");
    embedUrl.searchParams.set("background", "1");
    embedUrl.searchParams.set("loop", "1");
    embedUrl.searchParams.set("muted", "1");
    return { type: "embed", src: embedUrl.href };
  }

  if (hostname === "dai.ly" || hostname === "dailymotion.com" || hostname === "geo.dailymotion.com") {
    const videoId = hostname === "dai.ly"
      ? pathSegments[0]
      : hostname === "geo.dailymotion.com"
        ? url.searchParams.get("video")
        : pathSegments[0] === "embed" && pathSegments[1] === "video"
          ? pathSegments[2]
          : pathSegments.find((segment) => segment === "video") && pathSegments[pathSegments.indexOf("video") + 1];
    if (!videoId || !/^x[\w]+$/i.test(videoId)) return null;

    const embedUrl = new URL(`https://www.dailymotion.com/embed/video/${videoId}`);
    embedUrl.searchParams.set("autoplay", "1");
    embedUrl.searchParams.set("controls", "0");
    embedUrl.searchParams.set("mute", "1");
    return { type: "embed", src: embedUrl.href };
  }

  if (hostname === "drive.google.com") {
    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
    if (!fileId || !/^[\w-]+$/.test(fileId)) return null;
    return { type: "embed", src: `https://drive.google.com/file/d/${fileId}/preview` };
  }

  if (/(^|\/)(embed|player)(\/|$)/i.test(url.pathname)) {
    return { type: "embed", src: url.href };
  }

  return null;
}

export function isHttpsVideoUrl(value: string) {
  return getProfileBannerMedia(value) !== null;
}
