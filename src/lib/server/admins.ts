import "server-only";

const ADMIN_EMAILS = ["mudiallymohamed@gmail.com"];

export function isAdminEmail(email?: string | null) {
  return Boolean(email) && ADMIN_EMAILS.includes((email as string).trim().toLowerCase());
}
