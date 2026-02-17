import AllUsers from "@/components/all-users";
import CreateRegionForm from "@/components/create-region-form";
import InviteMemberByEmail from "@/components/invite-member-by-email";
import MembersTable from "@/components/members-table";
import PendingInvitations from "@/components/pending-invitations";
import { db } from "@/db/drizzle";
import { invitation as invitationTable, member as memberTable } from "@/db/schema";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";
import { getUsers } from "@/server/users";
import { and, eq } from "drizzle-orm";

type Params = Promise<{ slug: string }>;

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params;

  const organization = await getOrganizationBySlug(slug);
  const users = await getUsers(organization?.id || "");

  const session = await getCurrentUser();
  const myMembership = organization?.id
    ? await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, organization.id),
          eq(memberTable.userId, session.currentUser.id)
        ),
      })
    : null;

  const isSuperAdmin = myMembership?.role === "super_admin";

  const pendingInvites =
    isSuperAdmin && organization?.id
      ? await db.query.invitation.findMany({
          where: and(
            eq(invitationTable.organizationId, organization.id),
            eq(invitationTable.status, "pending")
          ),
        })
      : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <h1 className="font-bold text-2xl">{organization?.name}</h1>
      {isSuperAdmin ? <MembersTable members={organization?.members || []} /> : null}

      {!isSuperAdmin ? (
        <div className="rounded-md border p-4 text-sm">
          You don&apos;t have permission to view members or send invitations.
        </div>
      ) : null}

      {isSuperAdmin ? (
        <>
          <CreateRegionForm organizationId={organization?.id || ""} />
          <InviteMemberByEmail organizationId={organization?.id || ""} />
          <PendingInvitations
            invitations={pendingInvites.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role,
              status: i.status,
              expiresAt: i.expiresAt.toISOString(),
              regionId: (i as any).regionId ?? null,
            }))}
          />
          <AllUsers organizationId={organization?.id || ""} users={users} />
        </>
      ) : null}
    </div>
  );
}
