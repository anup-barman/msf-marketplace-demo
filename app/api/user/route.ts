import { getUserStore, publicUser } from "@/lib/userStore";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(publicUser(getUserStore()));
}
