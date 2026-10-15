import { getProfileBannerMedia } from "../lib/banner-options";
import Image from "next/image";
import { externalImageLoader } from "../lib/external-image-loader";

type ProfileBannerMediaProps = {
  url: string;
  className: string;
  controls?: boolean;
  previewOnly?: boolean;
};

export function ProfileBannerMedia({
  url,
  className,
  controls = false,
  previewOnly = false,
}: ProfileBannerMediaProps) {
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

  if (previewOnly && media.thumbnail) {
    return (
      <Image
        alt="Pratinjau banner YouTube"
        className={className}
        fill
        loader={externalImageLoader}
        sizes="(max-width: 640px) 45vw, 280px"
        src={media.thumbnail}
        unoptimized
      />
    );
  }

  return (
    <iframe
      allow="autoplay; encrypted-media"
      className={`${className} pointer-events-none`}
      loading={previewOnly ? "lazy" : "eager"}
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      tabIndex={-1}
      src={media.src}
      title="Pratinjau banner video"
    />
  );
}
