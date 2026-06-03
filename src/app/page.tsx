import { cookies } from "next/headers";
import { RoleAwareHome } from "./role-aware-home";
import { sessionCookieName } from "@/lib/auth-session";

export default async function Home() {
  const cookieStore = await cookies();

  return <RoleAwareHome initialSignedOut={!cookieStore.has(sessionCookieName)} />;
}
