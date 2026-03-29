import { cookies } from "next/headers";

const COOKIE_NAME = "thaiclaw_user";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}
