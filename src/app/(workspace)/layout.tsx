import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getSession } from "@/lib/session";
import { appRoleOf } from "@/lib/session";
import { getAppSettings } from "@/lib/app-settings";

export const runtime = "nodejs";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if ((session.user as typeof session.user & { isActive?: boolean }).isActive === false) redirect("/pending-approval");
  const user = session.user as typeof session.user & { appRole?: string };
  const settings = await getAppSettings();
  return <WorkspaceShell userName={user.name} email={user.email} role={appRoleOf(user)} settings={settings}>{children}</WorkspaceShell>;
}
