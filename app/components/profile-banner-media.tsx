import { getProfileBannerMedia } from "../lib/banner-options";

type ProfileBannerMediaProps = {
  url: string;
  className: string;
  controls?: boolean;
};

export function ProfileBannerMedia({ url, className, controls = false }: ProfileBannerMediaProps) {
  const media = getProfileBannerMedia(url);
  if (!media) return null;

  if (media.type === "video") {
    return (
      <video
        autoPlay
        className={className}
        controls={controls}
        loop
        muted
        playsInline
        preload="metadata"
        src={media.src}
      />
    );
  }

  return (
    <iframe
      allow="autoplay; encrypted-media; picture-in-picture"
      className={className}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      src={media.src}
      title="Pratinjau banner video"
    />
  );
}
