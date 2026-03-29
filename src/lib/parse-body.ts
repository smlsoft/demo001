import { NextRequest } from "next/server";

/**
 * Parse JSON body จาก request
 * ใช้แทน req.json() เพื่อ centralize การ parse
 */
export async function parseJsonBody<T = any>(req: NextRequest): Promise<T> {
  return await req.json() as T;
}
