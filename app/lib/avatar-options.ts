export const adminAvatarOptions = [
  { id: "red", label: "Merah", src: "/avatars/avatar-red.svg" },
  { id: "teal", label: "Teal", src: "/avatars/avatar-teal.svg" },
  { id: "gold", label: "Emas", src: "/avatars/avatar-gold.svg" },
  { id: "blue", label: "Biru", src: "/avatars/avatar-blue.svg" },
  { id: "green", label: "Hijau", src: "/avatars/avatar-green.svg" },
  { id: "pink", label: "Merah muda", src: "/avatars/avatar-pink.svg" },
] as const;

export const defaultAvatar = adminAvatarOptions[0].src;

export function isAdminAvatar(src: string, additionalUrls: string[] = []) {
  return adminAvatarOptions.some((avatar) => avatar.src === src) || additionalUrls.includes(src);
}