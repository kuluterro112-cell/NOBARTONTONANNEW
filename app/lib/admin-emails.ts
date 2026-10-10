export const adminEmails = ["ys309700@gmail.com"];

export function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails.includes(email.trim().toLowerCase()));
}