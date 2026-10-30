import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getSession } from "@/lib/session";
import { appRoleOf } from "@/lib/session";

export const runtime = "nodejs";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = session.user as typeof session.user & { appRole?: string };
  return <WorkspaceShell userName={user.name} email={user.email} role={appRoleOf(user)}>{children}</WorkspaceShell>;
}
