import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { LandingPage } from "@/components/LandingPage";

export default async function Home() {
  const userId = await getSessionUserId();
  if (userId) redirect("/dashboard");

  return <LandingPage />;
}
