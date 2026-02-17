import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

export default async function DashboardRedirectPage() {
  const session = await getCurrentUser();
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    redirect("/dashboard");
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, session.currentUser.id)
    ),
  });

  if (!membership) {
    redirect("/dashboard");
  }

  if (membership.role === "regional_admin" && membership.regionId) {
    redirect(`/dashboard/regions/${membership.regionId}`);
  }

  // Default dashboard experience for super/admin/member
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });

  if (org?.slug) {
    redirect(`/dashboard/organization/${org.slug}`);
  }

  redirect("/dashboard");
}
