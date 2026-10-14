export function isHttpsVideoUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      value.length <= 2048 &&
      /\.(mp4|webm|ogg)$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}
